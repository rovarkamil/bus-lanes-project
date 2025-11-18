/**
 * Smooth scrolling utility that works with Next.js routes
 * This keeps the route-based navigation intact while adding smooth scrolling
 */

// Map between route paths and component selectors
const routeToComponentMap: Record<string, string> = {
  "/diagnostic-services":
    '[class*="DiagnosticServices"], #diagnostic-services, [data-section="diagnostic-services"]',
  "/research-services":
    '[class*="GenomicResearch"], #research-services, [data-section="research-services"]',
  "/contact": '[class*="ContactUs"], #contact, [data-section="contact"]',
  "/faqs": '[class*="CommonQuestion"], #faqs, [data-section="faqs"]',
  "/about": '[class*="AboutUs"], #about, [data-section="about"]',
  "/news": '[class*="RecentBlog"], #news, [data-section="news"]',
  "/forms": 'form, #forms, [data-section="forms"]',
  // Also handle hash-based links
  "#diagnostic-services":
    '[class*="DiagnosticServices"], #diagnostic-services, [data-section="diagnostic-services"]',
  "#research-services":
    '[class*="GenomicResearch"], #research-services, [data-section="research-services"]',
  "#contact": '[class*="ContactUs"], #contact, [data-section="contact"]',
  "#faqs": '[class*="CommonQuestion"], #faqs, [data-section="faqs"]',
  "#about": '[class*="AboutUs"], #about, [data-section="about"]',
  "#news": '[class*="RecentBlog"], #news, [data-section="news"]',
  "#forms": 'form, #forms, [data-section="forms"]',
  // Handle empty hash links
  "#": '[class*="DiagnosticServices"], #diagnostic-services, [data-section="diagnostic-services"]',
};

let scrollingInProgress = false;

/**
 * Scroll to a section based on a Next.js route path
 * @param path The Next.js route path (e.g., '/about')
 * @param setOpen Function to close mobile menus (optional)
 */
export const scrollToSection = (
  path: string,
  setOpen?: (open: boolean) => void
): void => {
  // If scrolling is already in progress, don't do anything
  if (scrollingInProgress) return;

  // Mark scrolling as in progress
  scrollingInProgress = true;

  // Handle the path parameter better
  const normalizedPath =
    path.startsWith("#") && path !== "#"
      ? path
      : path.startsWith("/")
        ? path
        : `/${path}`;

  // Get the selector for this path
  const selector = routeToComponentMap[normalizedPath];

  if (!selector) {
    scrollingInProgress = false;
    return;
  }

  // Try to find the component using various selectors
  const selectors = selector.split(", ");
  let targetElement: Element | null = null;

  // First try to find by ID for hash-based links
  if (normalizedPath.startsWith("#") && normalizedPath !== "#") {
    const id = normalizedPath.substring(1);
    targetElement = document.getElementById(id);
  }

  // If we didn't find by ID, try the other selectors
  if (!targetElement) {
    for (const sel of selectors) {
      targetElement = document.querySelector(sel);
      if (targetElement) break;
    }
  }

  // If still not found, try searching for components by name
  if (!targetElement) {
    const componentMapping = {
      "diagnostic-services": "DiagnosticServices",
      "research-services": "GenomicResearch",
      contact: "ContactUs",
      faqs: "CommonQuestion",
      about: "AboutUs",
      news: "RecentBlog",
      forms: "form",
    };

    // Extract the section name from the path
    const sectionName = normalizedPath.startsWith("#")
      ? normalizedPath.substring(1)
      : normalizedPath.startsWith("/")
        ? normalizedPath.substring(1)
        : normalizedPath;

    const componentName =
      componentMapping[sectionName as keyof typeof componentMapping];

    if (componentName) {
      targetElement = document.querySelector(`[class*="${componentName}"]`);
    }
  }

  if (targetElement) {
    // Get the top position of the element and scroll to it
    const offsetPosition =
      targetElement.getBoundingClientRect().top + window.scrollY - 80;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });

    // Close mobile menu if provided
    if (setOpen) {
      setOpen(false);
    }

    // Add event listener to detect when scrolling is complete
    const detectScrollEnd = () => {
      const currentPosition = window.scrollY;

      // Check if we're close enough to the target position
      if (Math.abs(currentPosition - offsetPosition) < 50) {
        scrollingInProgress = false;
        window.removeEventListener("scroll", detectScrollEnd);
      }
    };

    window.addEventListener("scroll", detectScrollEnd);

    // Set a timeout to reset the flag in case scroll event doesn't fire
    setTimeout(() => {
      scrollingInProgress = false;
    }, 1000);
  } else {
    scrollingInProgress = false;
  }
};

/**
 * Initialize smooth scrolling behavior on all navigation links
 * Call this in the useEffect of navbar components
 */
export const initSmoothScrolling = (): (() => void) => {
  // Handler for link clicks
  const handleLinkClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest("a");

    if (!link) return;

    const href = link.getAttribute("href");

    // Handle both route paths and hash links
    if (href) {
      if (routeToComponentMap[href] || href === "#") {
        e.preventDefault();
        scrollToSection(href);
      } else if (href.startsWith("#")) {
        // Handle any hash link
        e.preventDefault();
        const id = href.substring(1);
        const element = document.getElementById(id);
        if (element) {
          const offsetPosition =
            element.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }
    }
  };

  // Add the event listener to capture link clicks
  document.addEventListener("click", handleLinkClick);

  // Return cleanup function
  return () => {
    document.removeEventListener("click", handleLinkClick);
  };
};
