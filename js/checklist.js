const buttons = document.querySelectorAll('.uncheck-all');

console.log(buttons); //.parentNode;

buttons.forEach((el) => {
	el.onclick = function() {
		console.log(el); //.parentNode;
		const section = el.parentNode;
		console.log(section);
		const arrays = section.querySelectorAll('input[type=checkbox]:checked');
		console.log(arrays);
		arrays.forEach(function(button) {
			button.click();
		});
		// const checked = el.parentNode.querySelectalAll('input[type=checkbox]:checked').forEach(e => e.click());
	};
});
// get parent div
// uncheck all


// buttons[0].onclick = function(){
//	document.querySelectorAll('input[type=checkbox]:checked').forEach(el => el.click());
// };
