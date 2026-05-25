/**
 * @name ProfileBackgrounds
 * @author Sombre
 * @version 1.2.0
 * @description Sets a custom background image behind your profile and popout — fills the entire inner frame (banner, edges, body, footer) while badges, text and buttons stay on top and clickable. Local only.
 * @source https://betterdiscord.app
 */

module.exports = class ProfileBannerImage {
    constructor(meta) {
        this.meta = meta;
        this.defaultSettings = {
            imageUrl: "",
            scale: 140,      // % (100 = cover)
            offsetX: 50,     // % (0 left, 50 center, 100 right)
            offsetY: 50,     // % (0 top, 50 center, 100 bottom)
            recent: []       // up to 10 most recent URLs
        };
        this.settings = { ...this.defaultSettings };
        this.styleId = "ProfileBannerImage-style";
        this.observer = null;
        this._managerEl = null;
    }

    /* ---------- lifecycle ---------- */
    start() {
        this.settings = Object.assign({}, this.defaultSettings, BdApi.Data.load(this.meta.name, "settings") || {});
        if (!Array.isArray(this.settings.recent)) this.settings.recent = [];
        this.injectStyle();
        this.startObserver();
    }

    stop() {
        if (this.observer) { this.observer.disconnect(); this.observer = null; }
        const el = document.getElementById(this.styleId);
        if (el) el.remove();
        if (this._managerEl) { this._managerEl.remove(); this._managerEl = null; }
        document.querySelectorAll("[data-pbi-applied]").forEach(n => {
            n.style.backgroundImage = "";
            n.style.backgroundSize = "";
            n.style.backgroundPosition = "";
            n.style.position = "";
            n.removeAttribute("data-pbi-applied");
            delete n.dataset.pbiUrl;
        });
        document.querySelectorAll("[data-pbi-clear]").forEach(n => n.removeAttribute("data-pbi-clear"));
        document.querySelectorAll("[data-pbi-full]").forEach(n => n.removeAttribute("data-pbi-full"));
        document.querySelectorAll(".pbi-manager-btn").forEach(n => n.remove());
    }

    /* ---------- save helper ---------- */
    _save() {
        BdApi.Data.save(this.meta.name, "settings", this.settings);
    }

    _pushRecent(url) {
        if (!url) return;
        this.settings.recent = this.settings.recent.filter(u => u !== url);
        this.settings.recent.unshift(url);
        if (this.settings.recent.length > 10) this.settings.recent.length = 10;
        this._save();
    }

    _setActive(url) {
        this.settings.imageUrl = url || "";
        if (url) this._pushRecent(url);
        this._save();
        this._repaintAll();
    }

    _repaintAll() {
        document.querySelectorAll("[data-pbi-applied]").forEach(n => {
            n.style.backgroundImage = "";
            n.style.backgroundSize = "";
            n.style.backgroundPosition = "";
            n.removeAttribute("data-pbi-applied");
            delete n.dataset.pbiUrl;
        });
        document.querySelectorAll("[data-pbi-clear]").forEach(n => n.removeAttribute("data-pbi-clear"));
        document.querySelectorAll("[data-pbi-full]").forEach(n => n.removeAttribute("data-pbi-full"));
        this.applyToAll();
    }

    /* ---------- settings panel (BD plugin settings) ---------- */
    getSettingsPanel() {
        const wrap = document.createElement("div");
        wrap.style.padding = "16px";
        wrap.style.color = "var(--text-normal)";
        wrap.style.fontFamily = "var(--font-primary)";

        const label = document.createElement("label");
        label.textContent = "Profile background image URL";
        label.style.cssText = "display:block;margin-bottom:6px;font-weight:600;";

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "https://example.com/image.png";
        input.value = this.settings.imageUrl || "";
        input.style.cssText = "width:100%;padding:8px 10px;border-radius:4px;border:1px solid var(--background-tertiary);background:var(--input-background);color:var(--text-normal);box-sizing:border-box;";

        const hint = document.createElement("div");
        hint.innerHTML = "To change the background image, find any image or GIF on the web then Right Click - Copy Image Address then Paste into the text box and Save. Only applies to your own profile, locally. Blank = disabled.";
        hint.style.cssText = "font-size:12px;color:var(--text-muted);margin-top:6px;line-height:1.4;";

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.style.cssText = "margin-top:12px;padding:8px 16px;background:var(--brand-experiment,#5865F2);color:#fff;border:none;border-radius:4px;cursor:pointer;";
        saveBtn.onclick = () => {
            this._setActive(input.value.trim());
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

            [data-pbi-clear] {
                background: transparent !important;
                background-color: transparent !important;
            }
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
            [data-pbi-applied] img[class^="banner"],
            [data-pbi-applied] img[class*=" banner"],
            [data-pbi-applied] svg[class^="banner"],
            [data-pbi-applied] svg[class*=" banner"],
            [data-pbi-applied] div[class^="bannerSVGWrapper"],
            [data-pbi-applied] div[class*=" bannerSVGWrapper"] {
                background: transparent !important;
                opacity: 0 !important;
            }

            /* Manager button */
            .pbi-manager-btn {
                position: absolute;
                top: 8px;
                right: 8px;
                z-index: 5;
                width: 28px; height: 28px;
                border-radius: 50%;
                background: rgba(0,0,0,0.55);
                color: #fff;
                border: 1px solid rgba(255,255,255,0.25);
                cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                font-size: 14px;
                backdrop-filter: blur(4px);
            }
            .pbi-manager-btn:hover { background: rgba(0,0,0,0.8); }

            /* Manager panel */
            .pbi-manager {
                position: fixed;
                z-index: 100000;
                width: 360px;
                background: #0f1620;
                color: #e6e6e6;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 10px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.6);
                padding: 14px;
                font-family: var(--font-primary, system-ui);
                background-image: linear-gradient(160deg, rgba(70,90,140,0.18), rgba(20,30,50,0.0)),
                                  url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><circle cx='10' cy='10' r='1' fill='%2334496e' opacity='0.35'/></svg>");
            }
            .pbi-manager h3 {
                margin: 0 0 8px 0; font-size: 13px; letter-spacing: 1px;
                text-transform: uppercase; color: #b8c4d6;
            }
            .pbi-manager .pbi-url-row { display: flex; gap: 6px; margin-bottom: 8px; }
            .pbi-manager input[type=text] {
                flex: 1; padding: 6px 8px; border-radius: 4px;
                background: #0a0f17; color: #fff;
                border: 1px solid rgba(255,255,255,0.1); font-size: 12px;
            }
            .pbi-manager button.pbi-apply {
                background: #2d6cdf; color: #fff; border: none; border-radius: 4px;
                padding: 6px 10px; cursor: pointer; font-size: 12px;
            }
            .pbi-slider-row { margin: 6px 0; font-size: 12px; }
            .pbi-slider-row label {
                display:flex; justify-content:space-between;
                color:#9aa7bd; margin-bottom: 2px;
            }
            .pbi-slider-row input[type=range] { width: 100%; }
            .pbi-meta { font-size: 11px; color: #8a96aa; margin: 6px 0 8px; }
            .pbi-grid {
                display: grid; grid-template-columns: repeat(3, 1fr);
                gap: 6px; max-height: 240px; overflow-y: auto;
            }
            .pbi-thumb {
                position: relative; aspect-ratio: 1/1;
                border-radius: 6px; overflow: hidden;
                background-size: cover; background-position: center;
                cursor: pointer; border: 2px solid transparent;
            }
            .pbi-thumb.active { border-color: #4ade80; }
            .pbi-thumb .pbi-size {
                position: absolute; left: 4px; bottom: 4px;
                background: rgba(0,0,0,0.7); color:#fff;
                font-size: 10px; padding: 1px 4px; border-radius: 3px;
            }
            .pbi-thumb .pbi-del {
                position: absolute; top: 2px; right: 2px;
                width: 18px; height: 18px; border-radius: 50%;
                background: rgba(0,0,0,0.7); color: #fff;
                border: none; cursor: pointer; font-size: 12px;
                display: none; line-height: 1;
            }
            .pbi-thumb:hover .pbi-del { display: block; }
            .pbi-footer { margin-top: 10px; display:flex; justify-content: space-between; }
            .pbi-footer button {
                background: transparent; color:#b8c4d6;
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 4px; padding: 5px 10px; cursor: pointer; font-size: 12px;
            }
            .pbi-footer button:hover { background: rgba(255,255,255,0.05); }
        `;
    }

    /* ---------- observer ---------- */
    startObserver() {
        this.applyToAll();
        this.observer = new MutationObserver(() => this.applyToAll());
        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    applyToAll() {
        const inners = document.querySelectorAll('div[class^="inner_"], div[class*=" inner_"]');

        inners.forEach(frame => {
            const isOwn = this._hasEditProfile(frame);
            // For OWN profile: use settings. For OTHERS: look for [pbg]url[/pbg] in their bio.
            let url = null;
            if (isOwn) {
                url = this.settings.imageUrl || this._extractSharedUrl(frame);
            } else {
                url = this._extractSharedUrl(frame);
            }
            if (!url) return;

            const fullRoot = this._findFullProfileRoot(frame, isOwn);
            const clearScope = fullRoot || frame;

            this._paintTarget(frame, url, isOwn);
            if (fullRoot) {
                this._paintTarget(fullRoot, url, isOwn);
                fullRoot.dataset.pbiFull = "true";
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
            clears.forEach(c => { if (!c.dataset.pbiClear) c.dataset.pbiClear = "true"; });

            // Inject Manager button (own profile popout only)
            if (isOwn && !frame.querySelector(":scope > .pbi-manager-btn")) {
                const btn = document.createElement("button");
                btn.className = "pbi-manager-btn";
                btn.title = "Background Manager";
                btn.textContent = "🖼";
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this._openManager(btn);
                };
                frame.appendChild(btn);
            }

            // Hide [pbg]...[/pbg] marker text in others' bios
            this._hideMarkerText(clearScope);
        });
    }

    _paintTarget(target, url, repaint) {
        const desired = url;
        if (target.dataset.pbiApplied && target.dataset.pbiUrl === desired && !repaint) {
            // keep size/pos updated each pass anyway (cheap)
        } else {
            target.style.position = target.style.position || "relative";
            target.style.backgroundImage = `url("${desired.replace(/"/g, '\\"')}")`;
            target.dataset.pbiApplied = "true";
            target.dataset.pbiUrl = desired;
        }
        const scale = Math.max(20, Number(this.settings.scale) || 100);
        target.style.backgroundSize = scale + "%";
        target.style.backgroundPosition = `${this.settings.offsetX}% ${this.settings.offsetY}%`;
    }

    _findFullProfileRoot(frame, isOwn) {
        let best = null;
        let node = frame;
        while (node && node !== document.body) {
            const ok = isOwn ? this._hasEditProfile(node) : true;
            if (ok && this._hasFullProfileMarkers(node)) {
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

    /* ---------- cross-user sharing via [pbg]URL[/pbg] in About Me ---------- */
    _extractSharedUrl(container) {
        const text = container.textContent || "";
        const m = text.match(/\[pbg\]\s*(https?:\/\/[^\s\[\]]+)\s*\[\/pbg\]/i);
        return m ? m[1] : null;
    }

    _hideMarkerText(container) {
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
        const re = /\[pbg\]\s*https?:\/\/[^\s\[\]]+\s*\[\/pbg\]/ig;
        const targets = [];
        let n;
        while ((n = walker.nextNode())) {
            if (re.test(n.nodeValue)) targets.push(n);
            re.lastIndex = 0;
        }
        targets.forEach(t => { t.nodeValue = t.nodeValue.replace(re, ""); });
    }

    /* ---------- Manager UI ---------- */
    _openManager(anchorBtn) {
        if (this._managerEl) { this._managerEl.remove(); this._managerEl = null; }

        const panel = document.createElement("div");
        panel.className = "pbi-manager";
        // Position panel to the LEFT of the popout/frame, not on top of it
        const frame = anchorBtn.closest('div[class^="inner_"], div[class*=" inner_"]') || anchorBtn.offsetParent || anchorBtn;
        const frameRect = frame.getBoundingClientRect();
        const panelWidth = 360;
        const gap = 10;
        const estPanelHeight = 480;
        let left = frameRect.left - panelWidth - gap;
        if (left < 8) {
            // Not enough room on the left — fall back to the right side of the popout
            left = Math.min(window.innerWidth - panelWidth - 8, frameRect.right + gap);
        }
        const top = Math.min(window.innerHeight - estPanelHeight - 8, Math.max(8, frameRect.top));
        panel.style.top = top + "px";
        panel.style.left = left + "px";

        panel.innerHTML = `
            <h3>Background Manager</h3>
            <div class="pbi-url-row">
                <input type="text" class="pbi-url" placeholder="Paste image URL…" value="${(this.settings.imageUrl||"").replace(/"/g,"&quot;")}">
                <button class="pbi-apply">Apply</button>
            </div>
            <div class="pbi-slider-row">
                <label><span>Scale</span><span class="pbi-v-scale">${this.settings.scale}%</span></label>
                <input type="range" class="pbi-scale" min="50" max="300" step="1" value="${this.settings.scale}">
            </div>
            <div class="pbi-slider-row">
                <label><span>Horizontal</span><span class="pbi-v-x">${this.settings.offsetX}%</span></label>
                <input type="range" class="pbi-x" min="0" max="100" step="1" value="${this.settings.offsetX}">
            </div>
            <div class="pbi-slider-row">
                <label><span>Vertical</span><span class="pbi-v-y">${this.settings.offsetY}%</span></label>
                <input type="range" class="pbi-y" min="0" max="100" step="1" value="${this.settings.offsetY}">
            </div>
            <div class="pbi-meta">Total size in memory: <span class="pbi-mem">—</span></div>
            <div class="pbi-grid"></div>
            <div class="pbi-footer">
                <button class="pbi-clear">Clear background</button>
                <button class="pbi-close">Close</button>
            </div>
        `;
        document.body.appendChild(panel);
        this._managerEl = panel;

        const $ = (s) => panel.querySelector(s);
        const grid = $(".pbi-grid");
        const memEl = $(".pbi-mem");

        const renderGrid = () => {
            grid.innerHTML = "";
            let totalBytes = 0;
            this.settings.recent.forEach((url, i) => {
                const t = document.createElement("div");
                t.className = "pbi-thumb" + (url === this.settings.imageUrl ? " active" : "");
                t.style.backgroundImage = `url("${url.replace(/"/g, '\\"')}")`;
                t.title = url;
                const sizeBadge = document.createElement("span");
                sizeBadge.className = "pbi-size";
                sizeBadge.textContent = "…";
                const del = document.createElement("button");
                del.className = "pbi-del";
                del.textContent = "×";
                del.onclick = (e) => {
                    e.stopPropagation();
                    this.settings.recent.splice(i, 1);
                    this._save();
                    renderGrid();
                };
                t.onclick = () => {
                    $(".pbi-url").value = url;
                    this._setActive(url);
                    renderGrid();
                };
                t.append(sizeBadge, del);
                grid.appendChild(t);

                // Fetch byte size (best-effort)
                fetch(url, { method: "GET", cache: "force-cache" })
                    .then(r => r.blob())
                    .then(b => {
                        totalBytes += b.size;
                        sizeBadge.textContent = this._formatBytes(b.size);
                        memEl.textContent = this._formatBytes(totalBytes);
                    })
                    .catch(() => { sizeBadge.textContent = "?"; });
            });
            if (!this.settings.recent.length) {
                grid.innerHTML = `<div style="grid-column:1/-1;color:#7a8699;font-size:12px;text-align:center;padding:18px;">No recent images yet. Apply one above.</div>`;
                memEl.textContent = "0 B";
            }
        };
        renderGrid();

        $(".pbi-apply").onclick = () => {
            const v = $(".pbi-url").value.trim();
            if (!v) return;
            this._setActive(v);
            renderGrid();
            BdApi.UI.showToast("Background applied", { type: "success" });
        };

        const liveUpdate = () => {
            this.settings.scale = Number($(".pbi-scale").value);
            this.settings.offsetX = Number($(".pbi-x").value);
            this.settings.offsetY = Number($(".pbi-y").value);
            $(".pbi-v-scale").textContent = this.settings.scale + "%";
            $(".pbi-v-x").textContent = this.settings.offsetX + "%";
            $(".pbi-v-y").textContent = this.settings.offsetY + "%";
            // Apply to currently painted elements live
            document.querySelectorAll("[data-pbi-applied]").forEach(el => {
                el.style.backgroundSize = this.settings.scale + "%";
                el.style.backgroundPosition = `${this.settings.offsetX}% ${this.settings.offsetY}%`;
            });
        };
        ["input", "change"].forEach(ev => {
            $(".pbi-scale").addEventListener(ev, liveUpdate);
            $(".pbi-x").addEventListener(ev, liveUpdate);
            $(".pbi-y").addEventListener(ev, liveUpdate);
        });
        $(".pbi-scale").addEventListener("change", () => this._save());
        $(".pbi-x").addEventListener("change", () => this._save());
        $(".pbi-y").addEventListener("change", () => this._save());

        $(".pbi-clear").onclick = () => {
            this._setActive("");
            $(".pbi-url").value = "";
            renderGrid();
        };
        $(".pbi-close").onclick = () => { panel.remove(); this._managerEl = null; };

        // Click outside to close
        setTimeout(() => {
            const onDoc = (e) => {
                if (!panel.contains(e.target) && e.target !== anchorBtn) {
                    panel.remove();
                    this._managerEl = null;
                    document.removeEventListener("mousedown", onDoc);
                }
            };
            document.addEventListener("mousedown", onDoc);
        }, 0);
    }

    _formatBytes(b) {
        if (b < 1024) return b + " B";
        if (b < 1024*1024) return (b/1024).toFixed(1) + " KB";
        return (b/1024/1024).toFixed(1) + " MB";
    }
};
