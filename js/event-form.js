// JS for event and inventory management

// General helper functions

/** Format a Date object into a "YYYY-MM-DD" string */
function formatDate(dateObj) {
	let year  = dateObj.getFullYear();
	let month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
	let date  = (dateObj.getDate()).toString().padStart(2, "0");
	return `${year}-${month}-${date}`;
}

/** Format a Date object into a "DD/MM/YYYY" string */
function friendlyDate(dateObj) {
	let year  = dateObj.getFullYear();
	let month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
	let date  = (dateObj.getDate()).toString().padStart(2, "0");
	return `${date}/${month}/${year}`;
}

/**
 * Recursive helper to create DOM elements from objects
 * Example parameter:
 * template = {
 *     tag: "span",             // HTML element tag
 *     attr: { id: "example" }, // Element attributes (optional)
 *     inner: [                 // Array of children (optional)
 *	       "Child nodes are ",  // Strings are TextNodes
 *	       {                    // Objects are their own templates
 *		       tag: "b",
 *		       inner: [
 *		           "here"
 *		       ],
 *		       events: {        // Event listeners
 *				   click: (e) => alert('Hi')
 *		       }
 *	       }
 *     ]
 * }
 * Equivalent HTML:
 * <span id="example">Child nodes are <b onclick="(e) => alert('Hi')">here</b></span>
 */
function createElem(template) {
	if (typeof template === "string" || template instanceof String) {
		return document.createTextNode(template);
	}
	let elem = document.createElement(template.tag);
	if ("inner" in template) {
		for (const child of template.inner) {
			elem.appendChild(createElem(child));
		}
	}
	if ("attr" in template) {
		for (const [attr, value] of Object.entries(template.attr)) {
			elem.setAttribute(attr, value);
		}
	}
	if ("events" in template) {
		for (const [event, callback] of Object.entries(template.events)) {
			elem.addEventListener(event, callback);
		}
	}
	return elem;
}

/** Get the start and end dates including days before and after */
function getUseDates(start, end, daysBefore, daysAfter) {
	useStart = new Date(start);
	useStart.setDate(useStart.getDate() - daysBefore);
	useStart.setHours(0, 0, 0, 0); // Set time to midnight to avoid problems with daylight savings
	useEnd = new Date(end);
	useEnd.setDate(useEnd.getDate() + daysAfter);
	useEnd.setHours(0, 0, 0, 0);
	return [useStart, useEnd];
}

// Global variables to keep track of the form values
let globalFilename = "";
let globalTitle = "";
let globalAuthor = "";
let globalDaysBefore = 0;
let globalStart = new Date;
let globalEnd = new Date;
let globalDaysAfter = 0;
let globalItems = {}; // example id: { added: true, quantity: 5 }

// DOM editing functions

/**
 * Filter items based on the search value and the category filter
 */
function filterItems() {
	const search = document.getElementById("item-search").value;
	const categoryFilterId = document.getElementById("category-filter").dataset.categoryId;
	const itemsTable = document.getElementById("items");
	for (let itemElem of itemsTable.children) {
		if ((categoryFilterId === ""
			 || JSON.parse(itemElem.dataset.categoryArray)
			        .includes(parseInt(categoryFilterId)))
			&& itemElem.dataset.filterName.includes(search)) {
			itemElem.hidden = false;
		} else {
			itemElem.hidden = true;
		}
	}
}

/**
 * Sort items by the data-sort-by attribute
 * Also added item come first (data-added attribute)
 */
function sortItems() {
	let itemsTable = document.getElementById("items");
	[].slice.call(itemsTable.children).sort((a, b) => {
		if ( a.dataset.added < b.dataset.added ) { return 1; }
		if ( a.dataset.added > b.dataset.added ) { return -1; }
		if ( a.dataset.sortBy < b.dataset.sortBy ) { return -1; }
		if ( a.dataset.sortBy > b.dataset.sortBy ) { return 1; }
		return 0;
	}).forEach((val, index) => {
		itemsTable.appendChild(val);
	});
}

// Main setup function

/** Setup the event form */
function setupEventForm(events, categories, items) {

	// Set global items variable
	globalItems = Object.fromEntries(items.map((item) => [item.id, { added: false, quantity: 0 }]));

	// Category and item helper functions

	/** Get item by id */
	function getItem(id) {
		for (const item of items) {
			if (id === item.id) {
				return item;
			}
		}
		console.log(`Item ${id} not found!`);
	}

	/** Get category by id */
	function getCategory(id) {
		for (const category of categories) {
			if (category.id === id) {
				return category;
			}
		}
		console.log(`Category ${id} not found!`);
	}

	// Callback functions

	/** Update stocks based on overlapping events */
	function updateStocks() {

		// Keep track of max use of items
		let maxStockUse = {} // use id: quantity

		// Keep track of events that use each item
		let stockEvents = {} // use id: event

		// Get the dates with the before and after buffers
		const [start, end] = getUseDates(globalStart, globalEnd, globalDaysBefore, globalDaysAfter);

		// Go through each day and get the use of each items
		for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
			let stockUse = {}
			for (const event of events) {
				const [eventStart, eventEnd] = getUseDates(event.start, event.end, event.days_before, event.days_after);

				if (date >= eventStart && date <= eventEnd) {
					for (const eventItem of event.items) {

						// Stock
						if (eventItem.id in stockUse) {
							stockUse[eventItem.id] += eventItem.quantity;
						} else {
							stockUse[eventItem.id] = eventItem.quantity;
						}

						// Events
						if (eventItem.id in stockEvents) {
							if (!stockEvents[eventItem.id].some((e) => e.title === event.title)) {
								stockEvents[eventItem.id].push({ ...event, quantity: eventItem.quantity });
							}
						} else {
							stockEvents[eventItem.id] = [{ ...event, quantity: eventItem.quantity }];
						}
					}
				}
			}
			for (const [id, quantity] of Object.entries(stockUse)) {
				if (id in maxStockUse) {
					if (quantity > maxStockUse[id]) {
						maxStockUse[id] = quantity;
					}
				} else {
					maxStockUse[id] = quantity;
				}
			}
		}

		// Update stock DOM
		for (const item of items) {
			let elem = document.getElementById(`item-${item.id}-stock`);
			available = item.id in maxStockUse ? item.stock - maxStockUse[item.id] : item.stock;
			let stockTemplate = {
				tag: "td",
				inner: [
					"(",
					{ tag: "b", inner: [`${available}/${item.stock}`] },
					` disponible${available == 1 ? '' : 's'})`
				],
				attr: {
					id: `item-${item.id}-stock`,
					class: available > 0 ? "stock" : "stock out-of-stock"
				}
			};
			if (item.id in stockEvents) {
				let usageTemplate = {
					tag: "div",
					inner: [{
						tag: "ul",
						inner: []
					}]
				};
				for (const stockEvent of stockEvents[item.id]) {
					const [useStart, useEnd] = getUseDates(stockEvent.start, stockEvent.end, stockEvent.days_before, stockEvent.days_after);
					usageTemplate.inner[0].inner.push({
						tag: "li",
						inner: [
							{ tag: "b", inner: [`${stockEvent.quantity}`] },
							" avec ",
							{ tag: "b", inner: [`${stockEvent.author}`] },
							...(useStart.getTime() === useEnd.getTime() ? [
								" le ",
								{ tag: "b", inner: [friendlyDate(useStart)] },
							] : [
								" du ",
								{ tag: "b", inner: [friendlyDate(useStart)] },
								" au ",
								{ tag: "b", inner: [friendlyDate(useEnd)] }
							]),
							` (${stockEvent.title})`]
					});
				}
				stockTemplate.inner.push(usageTemplate);
			}
			elem.replaceWith(createElem(stockTemplate));
		}
	}

	/** Get array of parent categories by id (of the child category) */
	function getCategoryArray(id) {

		let category = getCategory(id);
		if (category.parent_id === null) {
			return [ category ];
		}
		let parents = getCategoryArray(category.parent_id);
		parents.push(category);
		return parents;
	}

	// Create the item DOM elements
	let itemsTable = document.getElementById("items");
	for (const item of items) {

		// Category column
		let categoryTemplate = { tag: "td", attr: { class: "category" }, inner: [] };
		const categoryArray = getCategoryArray(item.category_id);
		const sortBy = categoryArray.map((category) => { // String used to sort items
			return category.name;
		}).join() + item.name;
		for (const [index, category] of categoryArray.entries()) {
			if (index > 0) { // Add a " > " between categories
				categoryTemplate.inner.push(" >\xa0");
			}
			categoryTemplate.inner.push({
				tag: "a",
				attr: { class: "category" },
				events: { click: (e) => {
					/** Set category filter */
					document.getElementById("category-filter").dataset.categoryId = category.id;
					document.getElementById("category-filter-display")
						    .textContent = getCategoryArray(category.id).map((category) => category.name).join(" >\xa0")
					filterItems();
				}},
				inner: [category.name]
			});
		}

		// Item, stock and select columns
		const itemTemplate = {
			tag: "tr",
			attr: {
				"data-category-array": JSON.stringify(categoryArray.map((category) => category.id)),
				"data-filter-name":    item.name.toLowerCase(),
				"data-sort-by":        sortBy,
				"data-added":          0
			},
			inner: [
				categoryTemplate,
				{ // Item column
					tag: "td",
					attr: { class: "item" },
					inner: [item.name]
				},
				{ // Stock column
					tag: "td",
					attr: { id: `item-${item.id}-stock`, class: "stock" },
				},
				{ // Select column
					tag: "td",
					attr: { class: "select" },
					inner: [
						{ // Add/remove button
							tag: "a",
							inner: ["ajouter"],
							events: { click: (e) => {
								/** Add or remove an item */
								if (e.target.parentNode.parentNode.dataset.added == 1) {
									e.target.textContent = "ajouter";
									e.target.parentNode.parentNode.dataset.added = 0;
									globalItems[item.id].added = false;
								} else {
									e.target.textContent = "enlever";
									e.target.parentNode.parentNode.dataset.added = 1;
									globalItems[item.id].added = true;
									if (e.target.nextSibling.value === "") {
										e.target.nextSibling.value = 1;
										e.target.nextSibling.dispatchEvent(new Event("change"));
									}
								}
								sortItems();
							}},
						},
						{ // Quantity input
							tag: "input",
							attr: {
								id: `item-${item.id}-input`,
								type: "number",
								min: 1
							}
						}
					]
				}
			]
		};
		itemsTable.appendChild(createElem(itemTemplate));
	}

	// Sort the items
	sortItems();

	// Update the stocks
	updateStocks()

	// Calendar picker (https://vanilla-calendar.com/)

	let options = {
		type: "multiple",
		settings: {
			selection: {
				day: "multiple-ranged",
			},
			visibility: {
				daysOutside: false,
				weekend: false,
				today: false
			},
		},
		popups: {},
		actions: {
			clickDay(e, dates) {
				dates.sort()
				globalStart = new Date(dates[0]);
				globalEnd = new Date(dates[dates.length - 1]);
				updateStocks();
			}
		}
	}

	const calendar = new VanillaCalendar("#calendar", options);
	calendar.init();

	// Event listeners

	document.getElementById("item-search").addEventListener("input", filterItems);

	document.getElementById("days-before").addEventListener("change", (e) => {
		globalDaysBefore = parseInt(e.target.value);
		updateStocks();
	});

	document.getElementById("days-after").addEventListener("change", (e) => {
		globalDaysAfter = parseInt(e.target.value);
		updateStocks();
	});

	document.getElementById("title").addEventListener("change", (e) => {
		globalTitle = e.target.value;
		updateStocks();
	});

	document.getElementById("author").addEventListener("change", (e) => {
		globalAuthor = e.target.value;
		updateStocks();
	});

	for (const item of items) {
		document.getElementById(`item-${item.id}-input`).addEventListener("change", (e) => {
			globalItems[item.id].quantity = e.target.value;
		});
	}

	document.getElementById("github").addEventListener("click", (e) => {
		filename = `${formatDate(globalStart)}_${globalTitle}.md`.normalize("NFKD")
																 .replace(/\p{Diacritic}/gu, "")
																 .replaceAll(" ", "_")
																 .toLowerCase();
		let yaml = `---
title:  ${globalTitle}
date:   ${formatDate(new Date)}
author: ${globalAuthor}

days_before: ${globalDaysBefore}
start:       ${formatDate(globalStart)}
end:         ${formatDate(globalEnd)}
days_after:  ${globalDaysAfter}
items:
`;
		for (const [id, usedItem] of Object.entries(globalItems)) {
			if (usedItem.added) {
				yaml += `    - id: ${id}\n      quantity: ${usedItem.quantity}\n`;
			}
		}
		yaml += "---"
		const queryString = (new URLSearchParams({ filename: filename, value: yaml })).toString();
		window.open(`https://github.com/matharel/vfub/new/main/content/evenements/?${queryString}`, "_blank");
	});
}
