const contentWindow = document.getElementById("content-window")
let granimInstance = null
let tabIndicator = null

function getSettingsDefaults() {
    if (window.SETTINGS_DEFAULTS) return window.SETTINGS_DEFAULTS
    return {
        invertStrengthPercent: 35,
        themeVariant: "default dark",
        activeModules: ["homepage", "about me", "my projects", "changelog", "credits", "settings"],
        animationSpeedMs: 10000
    }
}

function setCookie(name, value, days) {
    const date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    const expires = `expires=${date.toUTCString()}`
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/`
}

function getCookie(name) {
    const prefix = `${name}=`
    const parts = document.cookie.split(";").map(part => part.trim())
    const match = parts.find(part => part.startsWith(prefix))
    if (!match) return null
    return decodeURIComponent(match.slice(prefix.length))
}

function loadSettingsFromCookie() {
    const raw = getCookie("clkkhub_settings")
    if (!raw) return null
    try {
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== "object") return null
        return parsed
    } catch {
        return null
    }
}

function saveSettingsToCookie(settings) {
    setCookie("clkkhub_settings", JSON.stringify(settings), 365)
}

function getEffectiveSettings() {
    const defaults = getSettingsDefaults()
    const saved = loadSettingsFromCookie()
    return { ...defaults, ...(saved || {}) }
}

function updateRangeDisplay(rangeEl, valueEl, suffix) {
    if (!rangeEl || !valueEl) return
    const value = rangeEl.value
    valueEl.textContent = `${value}${suffix}`
}

function formatSpeedMs(ms) {
    const seconds = Number(ms) / 1000
    if (Number.isNaN(seconds)) return "0s"
    if (Number.isInteger(seconds)) return `${seconds}s`
    return `${seconds.toFixed(1)}s`
}

function getThemeVariant(themeName) {
    if (window.THEME_VARIANTS && window.THEME_VARIANTS[themeName]) {
        return window.THEME_VARIANTS[themeName]
    }
    if (window.THEME_VARIANTS) {
        const firstKey = Object.keys(window.THEME_VARIANTS)[0]
        return window.THEME_VARIANTS[firstKey]
    }
    return {
        gradients: [
            ["#212121", "#212121"],
            ["#212121", "#754b8f"],
            ["#212121", "#212121"],
            ["#624178", "#212121"],
            ["#212121", "#212121"]
        ],
        transitionSpeed: 10000
    }
}

function buildGranimConfig(settings) {
    const variant = getThemeVariant(settings.themeVariant)
    const transitionSpeed = settings.animationSpeedMs || variant.transitionSpeed || 10000
    return {
        element: "#granim-canvas1",
        name: "granim",
        opacity: [0, 0.3],
        direction: "custom",
        customDirection: {
            x0: "70%",
            y0: "20%",
            x1: "20%",
            y1: "80%"
        },
        states: {
            "default-state": {
                gradients: variant.gradients,
                transitionSpeed
            }
        }
    }
}

function applyGranimUpdate(settings) {
    if (typeof Granim !== "function") return
    if (granimInstance && typeof granimInstance.destroy === "function") {
        granimInstance.destroy()
    }
    granimInstance = new Granim(buildGranimConfig(settings))
    window.granimInstance = granimInstance
}

function initMyProjects() {
    const projectCards = contentWindow.querySelectorAll(".project[data-thumb]")
    projectCards.forEach(card => {
        const filename = card.getAttribute("data-thumb")
        const img = card.querySelector(".project-thumb")
        if (!img || !filename) return
        img.src = `thumbnails/${filename}`
        img.loading = "lazy"
        img.onerror = () => {
            img.style.display = "none"
        }
    })
}

function applyInvertEffects(enabled) {
    document.body.classList.toggle("no-invert", !enabled)
}

function applyInvertStrength(percent) {
    const safe = Math.max(0, Math.min(100, Number(percent) || 0))
    const inverted = 100 - safe
    document.documentElement.style.setProperty("--invert-strength", `${inverted}%`)
}

function updateToggleStateText(element, enabled) {
    if (!element) return
    element.textContent = enabled ? "enabled" : "disabled"
}

function updateDefaultLabels(defaults) {
    const nodes = contentWindow.querySelectorAll("[data-default-key]")
    nodes.forEach(node => {
        const key = node.getAttribute("data-default-key")
        const format = node.getAttribute("data-default-format") || "string"
        const value = defaults[key]
        let text = "default"
        if (format === "seconds") {
            text = `default: ${formatSpeedMs(value)}`
        } else if (format === "percent") {
            text = `default: ${value}%`
        } else if (format === "enabled") {
            text = `default: ${value ? "enabled" : "disabled"}`
        } else {
            text = `default: ${value}`
        }
        node.textContent = text
    })
}

async function initSettings() {
    const settings = getEffectiveSettings()
    const defaults = getSettingsDefaults()

    const speedRange = document.getElementById("speed-range")
    const speedValue = document.getElementById("speed-value")
    const themeSelect = document.getElementById("theme-variant")
    const modulesSelect = document.getElementById("active-modules")
    const invertToggle = document.getElementById("invert-effects-toggle")
    const invertState = document.getElementById("invert-effects-state")
    const invertStrengthRange = document.getElementById("invert-strength-range")
    const invertStrengthValue = document.getElementById("invert-strength-value")
    const invertStrengthGroup = document.getElementById("invert-strength-group")
    const clearCookiesBtn = document.getElementById("clear-cookies-btn")

    if (invertStrengthRange && invertStrengthValue) {
        invertStrengthRange.value = settings.invertStrengthPercent
        updateRangeDisplay(invertStrengthRange, invertStrengthValue, "%")
        applyInvertStrength(invertStrengthRange.value)
        invertStrengthRange.addEventListener("input", () => {
            updateRangeDisplay(invertStrengthRange, invertStrengthValue, "%")
            settings.invertStrengthPercent = Number(invertStrengthRange.value)
            applyInvertStrength(invertStrengthRange.value)
            saveSettingsToCookie(settings)
        })
    }

    if (speedRange && speedValue) {
        speedRange.value = settings.animationSpeedMs
        speedValue.textContent = formatSpeedMs(speedRange.value)
        speedRange.addEventListener("input", () => {
            speedValue.textContent = formatSpeedMs(speedRange.value)
            settings.animationSpeedMs = Number(speedRange.value)
            saveSettingsToCookie(settings)
            applyGranimUpdate(settings)
        })
    }

    if (themeSelect) {
        const variants = window.THEME_VARIANTS ? Object.keys(window.THEME_VARIANTS) : []
        if (variants.length) {
            themeSelect.innerHTML = ""
            variants.forEach(variant => {
                const option = document.createElement("option")
                option.value = variant
                option.textContent = variant
                themeSelect.appendChild(option)
            })
        }
        themeSelect.value = settings.themeVariant || themeSelect.value
        themeSelect.addEventListener("change", () => {
            settings.themeVariant = themeSelect.value
            saveSettingsToCookie(settings)
            applyGranimUpdate(settings)
        })
    }

    if (modulesSelect && Array.isArray(settings.activeModules)) {
        const activeSet = new Set(settings.activeModules)
        Array.from(modulesSelect.options).forEach(option => {
            option.selected = activeSet.has(option.value || option.textContent)
        })
        modulesSelect.addEventListener("change", () => {
            const selected = Array.from(modulesSelect.options)
                .filter(option => option.selected)
                .map(option => option.value || option.textContent)
            settings.activeModules = selected
            saveSettingsToCookie(settings)
        })
    }

    if (invertToggle) {
        const isEnabled = settings.invertEffectsEnabled !== false
        invertToggle.checked = isEnabled
        updateToggleStateText(invertState, isEnabled)
        applyInvertEffects(isEnabled)
        if (invertStrengthGroup) {
            invertStrengthGroup.classList.toggle("visible", isEnabled)
        }
        invertToggle.addEventListener("change", () => {
            settings.invertEffectsEnabled = invertToggle.checked
            updateToggleStateText(invertState, invertToggle.checked)
            applyInvertEffects(invertToggle.checked)
            if (invertStrengthGroup) {
                invertStrengthGroup.classList.toggle("visible", invertToggle.checked)
            }
            saveSettingsToCookie(settings)
        })
    }

    if (clearCookiesBtn) {
        clearCookiesBtn.addEventListener("click", () => {
            setCookie("clkkhub_settings", "", -1)
            location.reload()
        })
    }

    updateDefaultLabels(defaults)
}

async function loadTab(id) {
    document.querySelectorAll(".tab-btn").forEach(btn =>
        btn.classList.remove("active")
    )

    const btn = document.querySelector(`.tab-btn[data-target="${id}"]`)
    if (btn) btn.classList.add("active")
    updateTabIndicator(btn)

    try {
        contentWindow.classList.add("is-hidden")
        await new Promise(resolve => setTimeout(resolve, 150))
        const res = await fetch(`content/${id}.html`)
        if (!res.ok) throw new Error("load failed")

        const html = await res.text()
        contentWindow.innerHTML = html
        if (id === "settings") {
            initSettings()
        }
        if (id === "myprojects") {
            initMyProjects()
        }
        requestAnimationFrame(() => {
            contentWindow.classList.remove("is-hidden")
        })
    } catch {
        contentWindow.innerHTML = `<p class="buttontext">failed to load ${id}</p>`
        contentWindow.classList.remove("is-hidden")
    }
}

function updateTabIndicator(activeBtn) {
    const sidebar = document.querySelector(".sidebar")
    if (!sidebar || !activeBtn) return
    if (!tabIndicator) {
        tabIndicator = document.createElement("div")
        tabIndicator.className = "tab-indicator"
        sidebar.appendChild(tabIndicator)
    }
    const textEl = activeBtn.querySelector(".buttontext") || activeBtn
    const sidebarRect = sidebar.getBoundingClientRect()
    const textRect = textEl.getBoundingClientRect()
    const top = textRect.top - sidebarRect.top
    const left = textRect.left - sidebarRect.left
    tabIndicator.style.top = `${top - 2}px`
    tabIndicator.style.left = `${left - 6}px`
    tabIndicator.style.width = `${textRect.width + 12}px`
    tabIndicator.style.height = `${textRect.height + 4}px`
}

window.addEventListener("resize", () => {
    const activeBtn = document.querySelector(".tab-btn.active")
    if (activeBtn) updateTabIndicator(activeBtn)
})

document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.target
        history.pushState({}, "", `#${target}`)
        loadTab(target)
    })
})

window.addEventListener("load", () => {
    let hash = location.hash.replace("#", "")
    if (!hash) {
        hash = "homepage"
        history.replaceState({}, "", `#${hash}`)
    }
    applyGranimUpdate(getEffectiveSettings())
    const initialSettings = getEffectiveSettings()
    applyInvertEffects(initialSettings.invertEffectsEnabled !== false)
    applyInvertStrength(initialSettings.invertStrengthPercent)
    loadTab(hash)
})

window.addEventListener("popstate", () => {
    const hash = location.hash.replace("#", "") || "homepage"
    loadTab(hash)
})

