function* eg1(a, b) {
	console.log(a + b);
	yield a + b;
	console.log(a * b);
	yield a + b;
	console.log(a - b);
	yield a + b;
};

var eg_1 = eg1(10, 2);
eg_1.next();
eg_1.next();
eg_1.next();

function* eg2(a, b) {
	console.log(a + b);
	var x = yield a + b;
	console.log(x);
	var y = yield a + b;
	console.log(y);
	var z= yield a + b;
};

var eg_2 = eg2(10, 2);
eg_2.next(1);
eg_2.next(2);
eg_2.next(3);