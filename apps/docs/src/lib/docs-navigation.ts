export function scrollToDocsSection(targetId: string) {
  const id = targetId.replace(/^#/, "");
  const target = document.getElementById(id);

  if (!target) return false;

  const nav = document.getElementById("docs-navbar");
  const navOffset = nav?.offsetHeight ?? 0;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = target.getBoundingClientRect().top + window.scrollY - navOffset - 8;

  window.scrollTo({
    top,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });

  if (window.location.hash !== `#${id}`) {
    window.history.replaceState(null, "", `#${id}`);
  }

  return true;
}
