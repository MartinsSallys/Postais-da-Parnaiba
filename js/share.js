/**
 * Postais da Parnaíba — share helper.
 *
 * Uses the native Web Share API when available (mobile browsers show the OS
 * share sheet, where the user can pick Instagram, WhatsApp, etc.). On desktop
 * or unsupported browsers it falls back to copying the URL to the clipboard
 * and flipping the button label to "Link copiado!" for a moment.
 */
(function () {
    "use strict";

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).then(
                function () { return true; },
                function () { return legacyCopy(text); }
            );
        }
        return Promise.resolve(legacyCopy(text));
    }

    function legacyCopy(text) {
        var el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        var ok = false;
        try {
            ok = document.execCommand("copy");
        } catch (e) {
            ok = false;
        }
        document.body.removeChild(el);
        return ok;
    }

    function showCopied(button) {
        if (!button) return;
        var original = button.dataset.label || button.textContent;
        button.dataset.label = original;
        button.textContent = "Link copiado!";
        setTimeout(function () {
            button.textContent = original;
        }, 2500);
    }

    /**
     * Share the current page (or an explicit URL).
     * options: { title, text, url } — button is optional, used for the
     * "Link copiado!" fallback feedback.
     */
    window.sharePage = function (options, button) {
        var data = {
            title: (options && options.title) || document.title,
            text: (options && options.text) || "",
            url: (options && options.url) || window.location.href,
        };

        if (navigator.share) {
            navigator.share(data).catch(function () {
                /* user dismissed the share sheet — nothing to do */
            });
            return Promise.resolve();
        }

        return copyToClipboard(data.url).then(function (ok) {
            if (ok) {
                showCopied(button);
            } else if (button) {
                var original = button.textContent;
                button.textContent = "Nao foi possivel copiar";
                setTimeout(function () {
                    button.textContent = original;
                }, 2500);
            }
        });
    };
})();
