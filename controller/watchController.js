const async = require("async");

const Theme = require("../models/theme");
const Playlist = require("../models/playlist");

exports.watch = function (req, res, next) {
    let themeId = Number(req.params.id);
    let versionId = Number(req.query.v || 0);
    let sourceId = Number(req.query.s || -1);

    async.waterfall([
        function (callback) {
            Theme.findById(themeId).populate("series").exec(callback);
        },
        function (theme, callback) {
            if (!theme) {
                callback(404);
                return;
            }

            Playlist.findById("test-playlist").exec((err, playlist) => callback(err, theme, playlist && playlist.themes.includes(+theme.id)));
        },
        function (theme, inPlaylist, callback) {
            Theme.find({ series: theme.series }).sort("type index").exec((err, themes) => callback(err, theme, inPlaylist, themes));
        }
    ], (err, theme, inPlaylist, themes) => {

        if (err) {
            // Redirect to 404
            next();
            return;
        }

        theme = theme.toObject();
        themes = themes.map((otherTheme) => {
            return Object.assign(otherTheme.toObject(), {
                active: otherTheme.type === theme.type && otherTheme.index === theme.index
            })
        });

        let version = theme.versions.find((version) => version.index === versionId);
        if (!version) {
            // Redirect to 404
            next();
            return;
        }

        if (sourceId < 0) {
            sourceId = version.sources.indexOf(getPreferredSource(req, version.sources));
        }

        let source = version.sources[sourceId];
        if (!source) {
            // Redirect to 404
            next();
            return;
        }
        source.active = true;

        res.render("watch", {
            theme: theme,
            themes: themes,
            version: version,
            source: source,
            pageTitle: theme.title,
            inPlaylist: inPlaylist
        });

    });
};

// TODO: Make the user decide which tags he prefers (and save that in cookies or something)
const preferredTags = [
    0, // NC
    2  // 1080
];

function getPreferredSource(req, sources) {
    sources = sources.slice();
    sources.sort((a, b) =>
        preferredTags.filter((tag) => b.tags.find((testTag) => testTag.id === tag)).length -
        preferredTags.filter((tag) => a.tags.find((testTag) => testTag.id === tag)).length
    );
    return sources[0];
}