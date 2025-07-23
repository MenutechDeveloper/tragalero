$(document).ready(function(){
	AOS.init({ disable: 'mobile' });
	$('[data-bs-hover-animate]')
		.mouseenter( function(){ var elem = $(this); elem.addClass('animated ' + elem.attr('data-bs-hover-animate')) })
		.mouseleave( function(){ var elem = $(this); elem.removeClass('animated ' + elem.attr('data-bs-hover-animate')) });

(function(){

	if(!('requestAnimationFrame' in window)) return;
	if(/Mobile|Android/.test(navigator.userAgent)) return;

	var backgrounds = [];

	$('[data-bs-parallax-bg]').each(function(){
		var el = $(this);
		var bg = $('<div>');

		bg.css({
			backgroundImage: el.css('background-image'),
			backgroundSize: 'cover',
			backgroundPosition: 'center',
			position: 'absolute',
			height:'200%',
			width:'100%',
			top:0, left:0,
			zIndex: -100
		});

		bg.appendTo(el);
		backgrounds.push(bg[0]);

		el.css({
			position:'relative',
			background:'transparent',
			overflow: 'hidden',
		});
	});

	if(!backgrounds.length) return;

	var visible = [];
	var scheduled;

	$(window).on('scroll resize', scroll);

	scroll();

	function scroll(){

		visible.length = 0;

		for(var i = 0; i < backgrounds.length; i++){
			var rect = backgrounds[i].parentNode.getBoundingClientRect();

			if(rect.bottom > 0 && rect.top < window.innerHeight){
				visible.push({
					rect: rect,
					node: backgrounds[i]
				});
			}

		}

		cancelAnimationFrame(scheduled);

		if(visible.length){
			scheduled = requestAnimationFrame(update);
		}

	}

	function update(){

		for(var i = 0; i < visible.length; i++){
			var rect = visible[i].rect;
			var node = visible[i].node;

			var quot = Math.max(rect.bottom, 0) / (window.innerHeight + rect.height);

			node.style.transform = 'translate3d(0, '+(-50*quot)+'%, 0)';
		}

	}

})();
document.getElementById("dpcb").onclick = function() {dpcFunc();};

function dpcFunc() {
	if(document.getElementById("dpc").value === "deluxemt1") {
		document.getElementById("deluxp").innerHTML  = "$ 319.00";
		document.getElementById("os2").value = "319.00";
	} else if (document.getElementById("dpc").value === "deluxemt2"){
		document.getElementById("deluxp").innerHTML  = "$279.00";
		document.getElementById("os2").value = "279.00";
	} else {
		document.getElementById("deluxp").innerHTML  = "$ 386.00";
		document.getElementById("os2").value = "386.00";
	}
}
document.getElementById("ppcb").onclick = function() {ppcFunc();};

function ppcFunc() {
	if(document.getElementById("ppc").value === "premiummt1") {
		document.getElementById("premiump").innerHTML  = "$ 189.00";
		document.getElementById("os1").value = "189.00";
	} else if (document.getElementById("ppc").value === "premiummt2"){
		document.getElementById("premiump").innerHTML  = "$158.00";
		document.getElementById("os1").value = "158.00";
	} else {
		document.getElementById("premiump").innerHTML  = "$ 227.00";
		document.getElementById("os1").value = "227.00";
	}
}
document.getElementById("spcb").onclick = function() {spcFunc();};

function spcFunc() {
	if(document.getElementById("spc").value === "startermt1") {
		document.getElementById("startetp").innerHTML  = "$ 109.00";
		document.getElementById("os0").value = "109.00";
	} else if (document.getElementById("spc").value === "startermt2"){
		document.getElementById("startetp").innerHTML  = "$89.00";
		document.getElementById("os0").value = "89.00";
	} else {
		document.getElementById("startetp").innerHTML  = "$ 148.00";
		document.getElementById("os0").value = "148.00";
	}
}
});