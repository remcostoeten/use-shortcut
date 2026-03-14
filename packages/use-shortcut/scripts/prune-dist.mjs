import { readdirSync, unlinkSync } from "node:fs"
import { join } from "node:path"

for (const file of readdirSync("dist")) {
    if (!file.endsWith(".d.mts")) continue
    unlinkSync(join("dist", file))
}
