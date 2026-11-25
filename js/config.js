/**
 * Postais da Parnaíba — API endpoint configuration.
 *
 * Local development: the API is reached through the nginx proxy at "/api"
 * on the same host (see docker-compose dev profile in the backend repo).
 *
 * Production (Cloudflare Pages): the API lives on its own Render domain,
 * defined below in PRODUCTION_API_URL.
 *
 * Both can be overridden by setting window.API_BASE_URL or
 * window.__API_BASE__ before this script runs.
 */
(function () {
    "use strict";

    var PRODUCTION_API_URL = "https://postais-api.onrender.com";

    var host = window.location.hostname;
    var isLocal = host === "localhost" || host === "127.0.0.1" || host === "";

    if (!window.API_BASE_URL && !window.__API_BASE__) {
        window.API_BASE_URL = isLocal ? "/api" : PRODUCTION_API_URL;
    }

    // Origin of the API host — used to resolve server-side asset paths such
    // as "/static/uploads/..." (strip a trailing "/api" when present).
    var base = window.API_BASE_URL || window.__API_BASE__ || "/api";
    window.API_ORIGIN = base.replace(/\/api\/?$/, "");
})();
