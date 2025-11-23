let shiftTimeout;

document.addEventListener("keydown", (event) => {
    if (event.key === "Shift") {
        // Wait 500ms before applying the class change
        shiftTimeout = setTimeout(() => {
            document.querySelectorAll("table.keyboard").forEach(table => {
                table.classList.add("shift");
                table.classList.remove("default");
            });
        });
    }
});

document.addEventListener("keyup", (event) => {
    if (event.key === "Shift") {
        clearTimeout(shiftTimeout);
        document.querySelectorAll("table.keyboard").forEach(table => {
            table.classList.remove("shift");
            table.classList.add("default");
        });
    }
});
