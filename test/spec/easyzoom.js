(function () {

    var api, $easyzoom;

    var lifecycle = {
        beforeEach: function () {
            $easyzoom = $(".easyzoom").easyZoom();
            api = $easyzoom.data("easyZoom");
        },
        afterEach: function () {
            api.teardown();
            $easyzoom.removeData("easyZoom");
        }
    };

    QUnit.module("Setup", lifecycle);

    QUnit.test("$(collection).easyZoom()", function (assert) {
        assert.ok(api.$link.length, "Zoom link is found");
        assert.ok(api.$image.length, "Smaller image is found");
        assert.ok(api.opts.inlineOption, "Data attributes can be options");
        assert.ok(api.hasOwnProperty("$flyout"), "Flyout is created");
        assert.ok(api.hasOwnProperty("$notice"), "Notice is created");

        var events = $._data(api.$target.get(0), "events");

        assert.equal($.isEmptyObject(events), false, "Mouse and touch events bound to target");
    });

    QUnit.test("API", function (assert) {
        assert.equal(typeof api, "object", "API is available");
        assert.equal($.isEmptyObject(api), false, "API has returned methods");
    });

    QUnit.module("API", lifecycle);

    QUnit.test(".show()", function (assert) {
        var done = assert.async();

        assert.expect(2);

        api.opts.onShow = function () {
            assert.equal(api.isOpen, true, "Open flag is set to true");
            assert.equal(api.$flyout.parent().length, 1, "Flyout appended to DOM");

            done();
        };

        api.isMouseOver = true;

        api.show();
    });

    QUnit.test(".show(e)", function (assert) {
        var done = assert.async();

        assert.expect(2);

        var mock = {
            type: "mousemove",
            pageX: 0,
            pageY: 0
        };

        var stub = sinon.stub(api, "_move", function (e) {
            assert.equal(stub.calledOnce, true, "Internal ._move() method called when .show() is provided with an event");
            assert.equal(e, mock, "Internal ._move() method called with event passed to .show()");

            stub.restore();

            done();
        });

        api.isMouseOver = true;

        api.show(mock);
    });

    QUnit.test(".hide()", function (assert) {
        var done = assert.async();

        assert.expect(2);

        api.opts.onShow = function () {
            api.hide();
        };

        api.opts.onHide = function () {
            assert.equal(api.isOpen, false, "Open flag set to false");
            assert.equal(api.$flyout.parent().length, 0, "Flyout detached from DOM");

            done();
        };

        api.show();
    });

    QUnit.test(".swap()", function (assert) {
        var done = assert.async();

        assert.expect(6);

        var standard = "../example-images/test_standard.jpg";
        var zoom = "../example-images/test_zoom.jpg";

        api.swap(standard, zoom);

        assert.equal(api.$target.hasClass("is-loading"), false, "'Loading' state class has been removed");
        assert.equal(api.$target.hasClass("is-ready"), false, "'Ready' state class has been removed");
        assert.equal(api.$target.hasClass("is-error"), false, "'Error' state class has been removed");
        assert.equal(api.$image.attr("src"), standard, "Standard image SRC changed");
        assert.equal(api.$link.attr("href"), zoom, "Zoom image HREF changed");

        api.opts.onShow = function () {
            assert.equal(api.$zoom.attr("src"), zoom, "Zoom image loaded with new SRC");
            done();
        };

        api.isMouseOver = true;

        api.show();
    });

    QUnit.test(".swap(standard, zoom, srcsetString)", function (assert) {
        assert.expect(1);

        var standard = "../example-images/test_standard.jpg";
        var zoom = "../example-images/test_zoom.jpg";
        var srcsetString = "../example-images/test_standard.jpg 1x, ../example-images/test_zoom.jpg 2x";

        api.swap(standard, zoom, srcsetString);

        assert.equal(api.$image.attr("srcset"), srcsetString, "Standard image SRCSET changed");
    });

    QUnit.test(".swap(standard, zoom, srcsetArray)", function (assert) {
        assert.expect(1);

        var standard = "../example-images/test_standard.jpg";
        var zoom = "../example-images/test_zoom.jpg";
        var srcsetArray = ['../example-images/test_standard.jpg 1x', '../example-images/test_zoom.jpg 2x'];
        var srcsetString = '../example-images/test_standard.jpg 1x,../example-images/test_zoom.jpg 2x';

        api.swap(standard, zoom, srcsetArray);

        assert.equal(api.$image.attr("srcset"), srcsetString, "Standard image SRCSET changed");
    });

    QUnit.test(".teardown()", function (assert) {
        assert.expect(6);

        api.teardown();

        assert.equal(api.isOpen, undefined, "Open flag unset");
        assert.equal(api.isReady, undefined, "Ready flag unset");

        assert.equal(api.$target.hasClass("is-ready"), false, "Ready class removed from target");
        assert.equal(api.$target.hasClass("is-error"), false, "Error class removed from target");
        assert.equal(api.$target.hasClass("is-loading"), false, "Loading class removed from target");

        assert.equal($._data(api.$target.get(0), "events"), undefined, "Mouse and touch events removed from target");
    });

    QUnit.module("Internals", lifecycle);

    QUnit.test("._loadImage(path, callback)", function (assert) {
        var done = assert.async();

        assert.expect(5);

        api._loadImage(api.$link.attr("href"), function () {
            assert.equal(api.isReady, true, "Ready flag set to true");
            assert.equal(api.$notice.parent().length, 0, "Loading notice detached from DOM");
            assert.equal(api.$target.hasClass("is-loading"), false, "Loading class removed from target");

            done();
        });

        assert.equal(api.$target.hasClass("is-loading"), true, "Loading class added to target");
        assert.equal(api.$notice.parent().length, 1, "Loading notice appended to DOM");
    });

    QUnit.test("._loadImage(404)", function (assert) {
        var done = assert.async();

        assert.expect(3);

        api.opts.errorDuration = 100;
        api._loadImage("404.jpg");

        api.$zoom.on("error", function () {
            assert.equal(api.$notice.parent().length, 1, "Error notice appended to DOM");
            assert.equal(api.$target.hasClass("is-error"), true, "Error class added to target");

            setTimeout(function () {
                assert.equal(api.$notice.parent().length, 0, "Error notice removed from DOM");
                done();
            }, 100);
        });
    });

    QUnit.test("_move(e)", function (assert) {
        var done = assert.async();

        assert.expect(5);

        var offset = api.$target.position();

        var mock_1 = {
            type: "mousemove",
            pageX: offset.left + 10,
            pageY: offset.top + 10
        };

        var mock_2 = {
            type: "mousemove",
            pageX: offset.left + 100,
            pageY: offset.top + 100
        };

        var mock_3 = {
            type: "mousemove",
            pageX: offset.left - 10,
            pageY: offset.top - 10
        };

        var spy = sinon.spy(api, "hide");

        // Must open the flyout with a zoom image first
        api.opts.onShow = function () {
            var left, top;

            api._move(mock_1);

            left = parseInt(api.$zoom.css("left"), 10);
            top = parseInt(api.$zoom.css("top"), 10);

            assert.equal(left, -20, "2x scale zoom image moved 20px left given 10px offset");
            assert.equal(top, -20, "2x scale zoom image moved 20px top given 10px offset");

            api._move(mock_2);

            left = parseInt(api.$zoom.css("left"), 10);
            top = parseInt(api.$zoom.css("top"), 10);

            assert.equal(left, -200, "2x scale zoom image moved 200px left given 100px offset");
            assert.equal(top, -200, "2x scale zoom image moved 200px top given 100px offset");

            api._move(mock_3);

            assert.equal(spy.calledOnce, true, ".hide() is called if event is outside");

            done();
        };

        api.isMouseOver = true;

        api.show();
    });

})();
