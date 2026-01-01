const contentWindow = document.getElementById("content-window")

async function loadTab(id) {
    document.querySelectorAll(".tab-btn").forEach(btn =>
        btn.classList.remove("active")
    )

    const btn = document.querySelector(`.tab-btn[data-target="${id}"]`)
    if (btn) btn.classList.add("active")

    try {
        const res = await fetch(`content/${id}.html`)
        if (!res.ok) throw new Error("load failed")

        const html = await res.text()
        contentWindow.innerHTML = html
    } catch {
        contentWindow.innerHTML = `<p class="buttontext">failed to load ${id}</p>`
    }
}

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
    loadTab(hash)
})

window.addEventListener("popstate", () => {
    const hash = location.hash.replace("#", "") || "homepage"
    loadTab(hash)
})

