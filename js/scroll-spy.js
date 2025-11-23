window.addEventListener('DOMContentLoaded', () => {

    const TOC = document.querySelector('#TableOfContents');
	const observer = new IntersectionObserver(entries => {
		entries.forEach(entry => {
			const id = entry.target.getAttribute('id');
			if (entry.isIntersecting) {
                TOC.querySelectorAll('.active').forEach(function(item){
                    item.classList.remove('active');
                });
				document.querySelector(`#TableOfContents li a[href="#${id}"]`).parentElement.classList.add('active');
			} else {
				// document.querySelector(`#TableOfContents li a[href="#${id}"]`).parentElement.classList.remove('active');
			}
		});
    },{
        // root: document.querySelector("html"),
        rootMargin: "0% 0px -95%"
	});

	// Track all sections that have an `id` applied
	document.querySelectorAll('h2[id], h3[id]').forEach((title) => {
		observer.observe(title);
	});

    TOC.addEventListener('click', (el) => {

        setTimeout(function(){


        // close the menu
        document.querySelector('#TOC-container input').checked = false;

        }, 1000);

//        // petit hack dégueulasse pour que le menu soit sélectionné dans la TOC
//        // même en tout bas de page
//
//        // fait planter le scrolling
//        setTimeout(function(){
//            TOC.querySelectorAll('.active').forEach(function(item){
//                item.classList.remove('active');
//            });
//            el.target.parentElement.classList.add('active');
//        }, 4000);
    });

});
