/**
 * @name ProfileBackground
 * @author Sombre
 * @version 1.2.1
 * @description Sets a custom background image behind your profile and popout — fills the entire inner frame (banner, edges, body, footer) while badges, text and buttons stay on top and clickable. Local only.
 * @source https://betterdiscord.app
 */

module.exports = class ProfileBannerImage {
    constructor(meta) {
        this.meta = meta;
        this.defaultSettings = { imageUrl: "" };
        this.settings = { ...this.defaultSettings };
        this.styleId = "ProfileBannerImage-style";
        this.observer = null;
    }

    /* ---------- lifecycle ---------- */
    start() {
        this.settings = Object.assign({}, this.defaultSettings, BdApi.Data.load(this.meta.name, "settings") || {});
        this.injectStyle();
        this.startObserver();
    }

    stop() {
        if (this.observer) { this.observer.disconnect(); this.observer = null; }
        const el = document.getElementById(this.styleId);
        if (el) el.remove();
        document.querySelectorAll("[data-pbi-applied]").forEach(n => {
            n.style.backgroundImage = "";
            n.style.position = "";
            n.removeAttribute("data-pbi-applied");
        });
        document.querySelectorAll("[data-pbi-clear]").forEach(n => {
            n.removeAttribute("data-pbi-clear");
        });
        document.querySelectorAll("[data-pbi-full]").forEach(n => {
            n.removeAttribute("data-pbi-full");
        });
    }

    /* ---------- settings panel ---------- */
    getSettingsPanel() {
        const wrap = document.createElement("div");
        wrap.style.padding = "16px";
        wrap.style.color = "var(--text-normal)";
        wrap.style.fontFamily = "var(--font-primary)";

        const label = document.createElement("label");
        label.textContent = "Profile background image URL";
        label.style.display = "block";
        label.style.marginBottom = "6px";
        label.style.fontWeight = "600";

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "https://example.com/image.png";
        input.value = this.settings.imageUrl || "";
        input.style.width = "100%";
        input.style.padding = "8px 10px";
        input.style.borderRadius = "4px";
        input.style.border = "1px solid var(--background-tertiary)";
        input.style.background = "var(--input-background)";
        input.style.color = "var(--text-normal)";
        input.style.boxSizing = "border-box";

        const hint = document.createElement("div");
        hint.textContent = "To change the background image, find any image or GIF on the web then Right Click - Copy Image Address then Paste into the text box and Save. Only applies to your own profile, locally. Blank = disabled.";
        hint.style.fontSize = "12px";
        hint.style.color = "var(--text-muted)";
        hint.style.marginTop = "6px";

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.style.marginTop = "12px";
        saveBtn.style.padding = "8px 16px";
        saveBtn.style.background = "var(--brand-experiment, #5865F2)";
        saveBtn.style.color = "#fff";
        saveBtn.style.border = "none";
        saveBtn.style.borderRadius = "4px";
        saveBtn.style.cursor = "pointer";
        saveBtn.onclick = () => {
            this.settings.imageUrl = input.value.trim();
            BdApi.Data.save(this.meta.name, "settings", this.settings);
            this.injectStyle();
            // Force a repaint on already-rendered profiles.
            document.querySelectorAll("[data-pbi-applied]").forEach(n => {
                n.style.backgroundImage = "";
                n.removeAttribute("data-pbi-applied");
            });
            document.querySelectorAll("[data-pbi-clear]").forEach(n => n.removeAttribute("data-pbi-clear"));
            document.querySelectorAll("[data-pbi-full]").forEach(n => n.removeAttribute("data-pbi-full"));
            this.applyToAll();
            BdApi.UI.showToast("Profile background saved", { type: "success" });
        };

        wrap.append(label, input, hint, saveBtn);
        return wrap;
    }

    /* ---------- styles ---------- */
    injectStyle() {
        let el = document.getElementById(this.styleId);
        if (!el) {
            el = document.createElement("style");
            el.id = this.styleId;
            document.head.appendChild(el);
        }
        el.textContent = `
            [data-pbi-applied] {
                background-color: transparent !important;
                background-repeat: no-repeat !important;
                background-size: cover !important;
                background-position: center !important;
            }
            [data-pbi-applied]::before {
                content: "";
                position: absolute;
                inset: 0;
                background: linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.45));
                pointer-events: none;
                border-radius: inherit;
                z-index: 0;
            }
            [data-pbi-applied] > * { position: relative; z-index: 1; }

            /* Make the header/body/footer fills see-through so the image
               on the inner frame shows through their edges. */
            [data-pbi-clear] {
                background: transparent !important;
                background-color: transparent !important;
            }
            /* Full profile modal only: Discord now uses extra left-panel
               wrappers (often section/aside/main, not just div) plus
               ::before/::after overlays. Clear those surfaces so the modal
               matches the popout and the image remains visible everywhere.
               Interactive controls keep their normal button styling. */
            [data-pbi-full] :is(div, section, aside, main, article)[class]:not(button):not([role="button"]),
            [data-pbi-full] :is(div, section, aside, main, article)[class]::before,
            [data-pbi-full] :is(div, section, aside, main, article)[class]::after {
                background: transparent !important;
                background-color: transparent !important;
                box-shadow: none !important;
            }
            [data-pbi-full] [class*="overlay"],
            [data-pbi-full] [class*="Overlay"],
            [data-pbi-full] [class*="profilePanel"],
            [data-pbi-full] [class*="ProfilePanel"],
            [data-pbi-full] [class*="side"],
            [data-pbi-full] [class*="Side"],
            [data-pbi-full] [class*="container"],
            [data-pbi-full] [class*="Container"],
            [data-pbi-full] [class*="scroller"],
            [data-pbi-full] [class*="Scroller"] {
                background: transparent !important;
                background-color: transparent !important;
                box-shadow: none !important;
            }
            /* Hide the real banner image/svg so our custom image fills the
               banner area too. Badges, text and buttons stay on top. */
            [data-pbi-applied] img[class^="banner"],
            [data-pbi-applied] img[class*=" banner"],
            [data-pbi-applied] svg[class^="banner"],
            [data-pbi-applied] svg[class*=" banner"],
            [data-pbi-applied] div[class^="bannerSVGWrapper"],
            [data-pbi-applied] div[class*=" bannerSVGWrapper"] {
                background: transparent !important;
                opacity: 0 !important;
            }
        `;
    }

    /* ---------- observer ---------- */
    startObserver() {
        this.applyToAll();
        this.observer = new MutationObserver(() => this.applyToAll());
        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Find every "inner_xxxxx" frame on screen, keep only the ones that
     * contain an "Edit Profile" button (== your own profile popout/modal),
     * paint the image on the inner frame, and clear the background of the
     * header/body/footer children so the image fills the whole card.
     */
    applyToAll() {
        const url = this.settings.imageUrl;
        if (!url) return;

        const inners = document.querySelectorAll('div[class^="inner_"], div[class*=" inner_"]');

        inners.forEach(frame => {
            if (!this._hasEditProfile(frame)) return;

            const fullRoot = this._findFullProfileRoot(frame);
            const clearScope = fullRoot || frame;

            this._paintTarget(frame, url);
            if (fullRoot) {
                this._paintTarget(fullRoot, url);
                fullRoot.dataset.pbiFull = "true";
            } else if (frame.dataset.pbiFull) {
                delete frame.dataset.pbiFull;
            }

            const clears = clearScope.querySelectorAll(
                'div[class^="banner_"], div[class*=" banner_"],' +
                'div[class^="banner__"], div[class*=" banner__"],' +
                'div[class^="bannerSVGWrapper"], div[class*=" bannerSVGWrapper"],' +
                'svg[class^="banner"], svg[class*=" banner"],' +
                'div[class^="header_"], div[class*=" header_"],' +
                'div[class^="header__"], div[class*=" header__"],' +
                'div[class^="body_"], div[class*=" body_"],' +
                'div[class^="body__"], div[class*=" body__"],' +
                'div[class^="footer_"], div[class*=" footer_"],' +
                'div[class^="footer__"], div[class*=" footer__"],' +
                // Full profile modal (has Board/Activity/Wishlist tabs):
                // strip every Discord surface that can sit over the image.
                // These classes do not exist in the small hover popout.
                'div[class^="profileHeader_"], div[class*=" profileHeader_"],' +
                'div[class^="profileBody_"], div[class*=" profileBody_"],' +
                'div[class^="profileBanner_"], div[class*=" profileBanner_"],' +
                'div[class^="profilePanel_"], div[class*=" profilePanel_"],' +
                'div[class^="overlayBackground_"], div[class*=" overlayBackground_"],' +
                'div[class^="overlay_"], div[class*=" overlay_"],' +
                'section[class^="profilePanel_"], section[class*=" profilePanel_"],' +
                'aside[class^="profilePanel_"], aside[class*=" profilePanel_"],' +
                'main[class^="profileBody_"], main[class*=" profileBody_"]'
            );
            clears.forEach(c => {
                if (!c.dataset.pbiClear) c.dataset.pbiClear = "true";
            });
        });
    }

    _paintTarget(target, url) {
        if (!target.dataset.pbiApplied) {
            target.style.position = target.style.position || "relative";
            target.style.backgroundImage = `url("${url.replace(/"/g, '\\"')}")`;
            target.dataset.pbiApplied = "true";
        }
    }

    _findFullProfileRoot(frame) {
        let best = null;
        let node = frame;
        while (node && node !== document.body) {
            if (this._hasEditProfile(node) && this._hasFullProfileMarkers(node)) {
                const rect = node.getBoundingClientRect();
                const maxWidth = Math.min(window.innerWidth * 0.95, 1600);
                const maxHeight = Math.min(window.innerHeight * 0.98, 1200);
                if (rect.width >= 520 && rect.height >= 360 && rect.width <= maxWidth && rect.height <= maxHeight) {
                    best = node;
                }
            }
            node = node.parentElement;
        }
        return best;
    }

    _hasFullProfileMarkers(container) {
        const text = (container.textContent || "").replace(/\s+/g, " ");
        const hasTabs = text.includes("Board") && text.includes("Activity") && text.includes("Wishlist");
        const hasFullClasses = !!container.querySelector(
            'div[class^="profileBody_"], div[class*=" profileBody_"],' +
            'div[class^="profileHeader_"], div[class*=" profileHeader_"],' +
            'div[class^="profilePanel_"], div[class*=" profilePanel_"]'
        );
        return hasTabs || hasFullClasses;
    }

    _hasEditProfile(container) {
        const buttons = container.querySelectorAll('button, [role="button"]');
        for (const b of buttons) {
            const txt = (b.textContent || "").trim().toLowerCase();
            if (txt === "edit profile" || txt.startsWith("edit profile")) return true;
        }
        return false;
    }
};
