function toggleColumn() {
	let table = document.querySelector(".headers"); // Select the table by class

	// Map checkboxes to column indexes
	let columns = {
		"removeCol2": 2, // Chloé
		"removeCol3": 3, // Olive
		"removeCol4": 4  // Sébastien
	};

	for (let checkboxId in columns) {
		let colIndex = columns[checkboxId];
		let checkbox = document.getElementById(checkboxId);
		let isChecked = checkbox.checked;

		// Save the checkbox state in localStorage
		localStorage.setItem(checkboxId, isChecked);

		for (let row of table.rows) {
			if (row.cells.length > colIndex) { // Avoid errors if a row has fewer cells
				row.cells[colIndex].style.display = isChecked ? "" : "none";
			}
		}
	}
}

// Restore checkbox states and apply column visibility on page load
window.onload = function() {
	let checkboxes = ["removeCol2", "removeCol3", "removeCol4"];

	checkboxes.forEach(id => {
		let savedState = localStorage.getItem(id);
		if (savedState !== null) {
			document.getElementById(id).checked = savedState === "true"; // Convert string to boolean
		}
	});

	toggleColumn(); // Apply visibility changes
};
