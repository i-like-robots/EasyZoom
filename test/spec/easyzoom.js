(function() {

    var api, $easyzoom;

    var lifecycle = {
        setup: function() {
            $easyzoom = $(".easyzoom").easyZoom();
            api = $easyzoom.data("easyZoom");
        },
        teardown: function() {
            api.teardown();
            $easyzoom.removeData("easyZoom");
        }
    };

    module("Setup", lifecycle);

    test("$(collection).easyZoom()", function() {

        ok(api.$link.length, "Zoom link is found");
        ok(api.$image.length, "Smaller image is found");
        ok(api.hasOwnProperty("$flyout"), "Flyout is created");
        ok(api.hasOwnProperty("$notice"), "Notice is created");

        var events = $._data(api.$target.get(0), "events");

        equal($.isEmptyObject(events), false, "Mouse and touch events bound to target");


    });

    test("API", function() {

        equal(typeof api, "object", "API is available");
        equal($.isEmptyObject(api), false, "API has returned methods");

    });

    module("API", lifecycle);

    asyncTest(".show()", function() {

        expect(2);

        api.opts.onShow = function() {

            equal(api.isOpen, true, "Open flag is set to true");
            equal(api.$flyout.parent().length, 1, "Flyout appended to DOM");

            start();
        };

        api.show();

    });

    asyncTest(".hide()", function() {

        expect(2);

        api.opts.onShow = function() {
            api.hide();
        };

        api.opts.onHide = function() {

            equal(api.isOpen, false, "Open flag set to false");
            equal(api.$flyout.parent().length, 0, "Flyout detached from DOM");

            start();
        };

        api.show();

    });

    test(".teardown()", function() {

        api.teardown();

        equal(api.isOpen, undefined, "Open flag unset");
        equal(api.isReady, undefined, "Ready flag unset");

        equal(api.$target.hasClass("is-ready"), false, "Ready class removed from target");
        equal(api.$target.hasClass("is-error"), false, "Error class removed from target");
        equal(api.$target.hasClass("is-loading"), false, "Loading class removed from target");

        equal($._data(api.$target.get(0), "events"), undefined, "Mouse and touch events removed from target");

    });

    module("Internals", lifecycle);

    asyncTest("._load(path, callback)", function() {

        expect(5);

        api._load(api.$link.attr("href"), function() {

            equal(api.isReady, true, "Ready flag set to true");
            equal(api.$notice.parent().length, 0, "Loading notice detached from DOM");
            equal(api.$target.hasClass("is-loading"), false, "Loading class removed from target");

            start();
        });

        equal(api.$target.hasClass("is-loading"), true, "Loading class added to target");
        equal(api.$notice.parent().length, 1, "Loading notice appended to DOM");

    });

    asyncTest("._load(404)", function() {

        expect(2);

        api._load("404.jpg");

        api.$zoom.on("error", function() {

            equal(api.$notice.parent().length, 1, "Error notice appended to DOM");
            equal(api.$target.hasClass("is-error"), true, "Error class added to target");

            start();
        });

    });

})();