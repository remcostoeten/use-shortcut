import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

async function readLines(page: Page, id: string): Promise<string[]> {
    const text = await page.locator(`#${id}`).innerText()
    return text.split("\n").filter((line) => line.length > 0)
}

function readLog(page: Page): Promise<string[]> {
    return readLines(page, "log")
}

function readKeys(page: Page): Promise<string[]> {
    return readLines(page, "keys")
}

function activeTag(page: Page): Promise<string> {
    return page.evaluate(() => document.activeElement?.tagName ?? "")
}

test.beforeEach(async ({ page }) => {
    await page.goto("/")
})

test("mod+k fires with Ctrl and prevents the browser default", async ({ page }) => {
    await page.keyboard.press("Control+k")
    expect(await readLog(page)).toEqual(["mod+k press"])
    expect(await readKeys(page)).toContain("keydown k repeat=false prevented=true")
    expect(await activeTag(page)).toBe("BODY")
})

test("plain keys are skipped inside an input unless allowed", async ({ page }) => {
    await page.locator("#field").focus()
    await page.keyboard.press("s")
    expect(await readLog(page)).toEqual([])
    await page.keyboard.press("t")
    expect(await readLog(page)).toEqual(["t press"])
    await page.locator("#button").click()
    await page.keyboard.press("s")
    expect(await readLog(page)).toEqual(["t press", "s press"])
})

test("a skipped binding leaves the typed character in the input", async ({ page }) => {
    await page.locator("#field").focus()
    await page.keyboard.press("s")
    expect(await readLog(page)).toEqual([])
    expect(await page.locator("#field").inputValue()).toBe("s")
})

test("g then d fires inside the timeout and not after it", async ({ page }) => {
    await page.keyboard.press("g")
    await page.keyboard.press("d")
    expect(await readLog(page)).toEqual(["g then d press"])
    await page.keyboard.press("g")
    await page.waitForTimeout(1200)
    await page.keyboard.press("d")
    expect(await readLog(page)).toEqual(["g then d press"])
})

test("a hold reports start then release with its duration", async ({ page }) => {
    await page.keyboard.down("c")
    await page.waitForTimeout(400)
    await page.keyboard.up("c")
    const [start, release] = await readLog(page)
    expect(start).toBe("hold c start 200")
    expect(release).toMatch(/^hold c release \d+$/)
    const duration = Number(release?.split(" ").at(-1))
    expect(duration).toBeGreaterThan(200)
})

test("a short tap on a key bound as tap and hold fires the tap only", async ({ page }) => {
    await page.keyboard.down("h")
    await page.keyboard.up("h")
    await page.waitForTimeout(300)
    expect(await readLog(page)).toEqual(["h press"])
})

test("a repeated keydown does not fire the press twice", async ({ page }) => {
    await page.keyboard.down("s")
    await page.waitForTimeout(800)
    await page.keyboard.up("s")
    expect(await readLog(page)).toEqual(["s press"])
    expect((await readKeys(page)).filter((line) => line.startsWith("keydown s"))).toHaveLength(1)
    await page.evaluate(() => {
        const event = new KeyboardEvent("keydown", {
            key: "s",
            repeat: true,
            bubbles: true,
            cancelable: true,
        })
        document.body.dispatchEvent(event)
    })
    expect(await readLog(page)).toEqual(["s press"])
    expect(await readKeys(page)).toContain("keydown s repeat=true prevented=false")
})

test("focus leaving the window releases a running hold", async ({ page }) => {
    await page.keyboard.down("c")
    await page.waitForTimeout(400)
    expect(await readLog(page)).toEqual(["hold c start 200"])
    await page.evaluate(() => {
        const frame = document.createElement("iframe")
        frame.src = "about:blank"
        document.body.append(frame)
        frame.contentWindow?.focus()
    })
    await expect.poll(() => readLog(page)).toHaveLength(2)
    const [, release] = await readLog(page)
    expect(release).toMatch(/^hold c release \d+$/)
    expect(await readKeys(page)).toContain("window blur")
    await page.keyboard.up("c")
    expect(await readLog(page)).toHaveLength(2)
})

test("except modal skips keys aimed at the page behind an open dialog", async ({ page }) => {
    await page.locator("#open-modal").click()
    expect(await activeTag(page)).toBe("BUTTON")
    await page.keyboard.press("m")
    expect(await readLog(page)).toEqual(["m press"])
    await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    })
    expect(await activeTag(page)).toBe("BODY")
    await page.keyboard.press("m")
    expect(await readLog(page)).toEqual(["m press"])
    await page.locator("#close-modal").click()
    await page.keyboard.press("m")
    expect(await readLog(page)).toEqual(["m press", "m press"])
})

test("a hold on space keeps the page from scrolling", async ({ page }) => {
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    await page.keyboard.down("Space")
    await page.waitForTimeout(400)
    await page.keyboard.up("Space")
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    expect(await readLog(page)).toEqual(
        expect.arrayContaining([
            "hold space start 200",
            expect.stringMatching(/^hold space release/),
        ]),
    )
    expect(await readKeys(page)).toContain("keydown   repeat=false prevented=true")
})
