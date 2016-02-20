/**
 * Created by Awesome on 2/20/2016.
 */


var menus  = require(global.appRoot + '/cache/menus.json');
var exphbs = require('express-handlebars');
var path   = require('path');

/**
 * export exhbs constructor
 */
module.exports = exphbs({
    // set layouts directory
    layoutsDir    : global.appRoot + '/cache/view/layout',

    // set default layout
    defaultLayout : 'main.layout.hbs',

    // set hbs extension name
    extname       : '.hbs',

    // set default helpers
    helpers       : {

        /**
         * block helper
         *
         * @param name
         * @returns {*}
         */
        block: function (name) {
            var blocks  = this._blocks,
                content = blocks && blocks[name];

            return content ? content.join('\n') : null;
        },

        /**
         * content for block helper
         *
         * @param name
         * @param options
         */
        contentFor: function (name, options) {
            var blocks = this._blocks || (this._blocks = {}),
                block  = blocks[name] || (blocks[name] = []);

            block.push(options.fn(this));
        },

        /**
         * menu helper
         *
         * @param name
         * @param path
         * @returns {string}
         */
        menu : function(name, path) {
            if (menus[name]) {
                var menu = menus[name];
                var rtn  = '<ul class="nav navbar-nav">';

                for (var key in menu) {
                    rtn += '<li class="nav-item">';

                    if (menu[key].children.length) {
                        rtn += '<a class="nav-link dropdown-toggle' + (path == menu[key].route ? ' active' : '') + '" data-toggle="dropdown" href="' + (menu[key].route ? menu[key].route : '#!') + '" role="button" aria-haspopup="true" aria-expanded="false">' + menu[key].title + '</a>';
                        rtn += '<div class="dropdown-menu">';
                        for (var sub in menu[key].children) {
                            rtn += '<a class="dropdown-item" href="' + (menu[key].children[sub].route ? menu[key].children[sub].route : '#!') + '">' + menu[key].children[sub].title + '</a>';
                        }
                        rtn += '</div>';
                    } else {
                        rtn += '<a class="nav-link' + (path == menu[key].route ? ' active' : '') + '" href="' + (menu[key].route ? menu[key].route : '#!') + '">' + menu[key].title + '</a>';
                    }

                    rtn += '</li>';
                }

                rtn += '</ul>';

                return rtn;
            }
        }
    }
});