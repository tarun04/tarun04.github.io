setTimeout(function () {
	$("#project1").mouseover(function () {
		$("#project1-text").removeClass("hidden");
	});

	$("#project1").mouseout(function () {
		$("#project1-text").addClass("hidden");
	});

	$("#project1").click(function () {
		window.location.href = "https://github.com/tarun04/password_manager";
	});

	$("#project2").mouseover(function () {
		$("#project2-text").removeClass("hidden");
	});

	$("#project2").mouseout(function () {
		$("#project2-text").addClass("hidden");
	});

	$("#project2").click(function () {
		window.location.href = "https://github.com/tarun04/MonoRepo";
	});

	$("#project3").mouseover(function () {
		$("#project3-text").removeClass("hidden");
	});

	$("#project3").mouseout(function () {
		$("#project3-text").addClass("hidden");
	});

	$("#project3").click(function () {
		window.location.href = "https://github.com/tarun04/tic-tac-toe";
	});
}, 300);
