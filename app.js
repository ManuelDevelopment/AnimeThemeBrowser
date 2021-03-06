const express = require("express");
const handlebars = require("express-handlebars");
const app = express();
const port = 3000;

require("./db").connect(() => {

    app.engine("hbs", handlebars({
        defaultLayout: "default",
        extname: ".hbs",
        helpers: {
            json: function (context) {
                return JSON.stringify(context);
            },
            ifExists: function (value, options) {
                if (value !== undefined) {
                    return options.fn(this);
                }

                return options.inverse(this);
            },
            unlessExists: function (value, options) {
                if (value === undefined) {
                    return options.fn(this);
                }

                return options.inverse(this);
            },
            ifEquals: function (a, b, options) {
                if (a === b) {
                    return options.fn(this);
                }
                return options.inverse(this);
            }
        }
    }));

    app.set("view engine", "hbs");
    app.set("views", "views");
    app.set("json spaces", 2);

    app.use(express.static("static"));
    app.use(express.static("vendor"));
    app.use(require("body-parser").json());

    // Routes
    app.get("/", require("./controller/seriesController").top);
    app.use("/", require("./routes/browseRoute"));
    app.use("/", require("./routes/seriesRoute"));
    app.use("/watch", require("./routes/watchRoute"));
    app.use("/", require("./routes/playlistRoute"));
    app.get("/mal/:username", require("./routes/mal-import"));
    app.get("/quiz", require("./routes/quizRoute"));

    // 404 handler
    app.use(function (req, res) {
        res.status(404).render("error", {
            code: 404,
            message: "Page not found.",
            pageTitle: "404"
        });
    });

    app.listen(port);

});