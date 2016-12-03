/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// require dependencies
var os    = require ('os');
var parse = require ('parse-comments');

/**
 * build config pipe
 */
class configParser {
  /**
   * construct config pipe
   */
  constructor () {
    // bind methods
    this.parse = this.parse.bind (this);

    // bind tag methods
    this._acl = this._acl.bind (this);
  }

  /**
   * parse pipe chunk
   *
   * @param {*} chunk
   */
  parse (chunk) {
    // set default variables
    let file     = chunk.path.split ('bundles/')[1].replace (/\\/g, '/').split ('.js')[0];
    let data     = chunk.contents.toString ();
    let lines    = data.split (os.EOL);
    let comments = parse (data);

    // set return
    var returns = {
      'menus'   : {},
      'routes'  : [],
      'classes' : {},
      'sockets' : []
    };

    // set class in returns
    returns.classes[file] = {
      'acl'     : [],
      'fail'     : false,
      'file'     : file,
      'name'     : '',
      'desc'     : '',
      'mount'    : '/',
      'priority' : 0
    };

    // loop comments
    for (var a = 0; a < comments.length; a++) {
      // check if class
      if (comments[a].comment.code.indexOf ('class') > -1) {
        // set class
        returns.classes[file].name = comments[a].comment.code.split ('class')[1].split ('extends')[0].trim ();
        returns.classes[file].desc = comments[a].description;

        // check for mount
        if (comments[a].acls)       returns.classes[file].acl      = this._acl (comments[a].acls);
        if (comments[a].fails)      returns.classes[file].fail     = comments[a].fails[0].description;
        if (comments[a].mounts)     returns.classes[file].mount    = comments[a].mounts[0].description;
        if (comments[a].priorities) returns.classes[file].priority = parseInt (comments[a].priorities[0].description);
      }

      // check routes
      if (comments[a].routes) {
        // set function
        let fn = comments[a].comment.code.split ('(')[0].trim ();
            fn = fn.split (' ').length > 1 ? fn.split (' ')[fn.split (' ').length - 1] : fn;

        // loop routes
        for (var b = 0; b < comments[a].routes.length; b++) {
          // set route
          let route = {
            'fn'       : fn,
            'acl'      : comments[a].acls ? returns.classes[file].acl.concat (this._acl (comments[a].acls)) : returns.classes[file].acl,
            'fail'     : comments[a].fails ? comments[a].fails[0].description : returns.classes[file].fail,
            'type'     : comments[a].routes[b].type,
            'desc'     : comments[a].description,
            'class'    : file,
            'mount'    : returns.classes[file].mount,
            'route'    : comments[a].routes[b].description,
            'priority' : comments[a].priorities ? parseInt (comments[a].priorities[0].description) : returns.classes[file].priority
          };

          // push to routes
          returns.routes.push (route);
        }

        // check if menus
        if (comments[a].menus) {
          // loop menus
          for (var c = 0; c < comments[a].menus.length; c++) {
            // set path
            let path = (returns.classes[file].mount + (comments[a].routes ? comments[a].routes[0].description : '/')).split ('//').join ('/');
                path = path.length > 1 ? path.replace (/\/$/, '') : path;

            // check if menu exists
            if (!returns.menus[comments[a].menus[c].type]) returns.menus[comments[a].menus[c].type] = [];

            // push to menus
            returns.menus[comments[a].menus[c].type].push ({
              'acl'      : comments[a].acls ? returns.classes[file].acl.concat (this._acl (comments[a].acls)) : returns.classes[file].acl,
              'icon'     : comments[a].icons ? comments[a].icons[0].description : false,
              'route'    : path,
              'title'    : comments[a].menus[c].description,
              'parent'   : comments[a].parents ? comments[a].parents[0].description : false,
              'priority' : comments[a].priorities ? parseInt (comments[a].priorities[0].description) : returns.classes[file].priority
            });
          }
        }
      }

      // check sockets
      if (comments[a].sockets) {
        // set function
        let fn = comments[a].comment.code.split ('(')[0].trim ();
            fn = fn.split (' ').length > 1 ? fn.split (' ')[fn.split (' ').length - 1] : fn;

        // loop routes
        for (var d = 0; d < comments[a].sockets.length; d++) {
          // set route
          let socket = {
            'fn'       : fn,
            'acl'      : comments[a].acls ? returns.classes[file].acl.concat (this._acl (comments[a].acls)) : returns.classes[file].acl,
            'desc'     : comments[a].description,
            'name'     : comments[a].sockets[d].type ? comments[a].sockets[d].type : comments[a].sockets[d].description.replace ('{', '').replace ('}', ''),
            'class'    : file,
            'priority' : comments[a].priorities ? parseInt (comments[a].priorities[0].description) : returns.classes[file].priority
          };

          // push to routes
          returns.sockets.push (socket);
        }
      }
    }

    // return returns
    return returns;
  }

  /**
   * returns acl array for tag
   *
   * @param {Array} tags
   *
   * @returns {*}
   * @private
   */
  _acl (tags) {
    // set acls
    var returns = [];

    // loop tags
    for (var i = 0; i < tags.length; i++) {
      // add to returns
      returns.push (tags[i].description === 'true' || tags[i].description === 'false' ? tags[i].description === 'true' : tags[i].description);
    }

    // return returns
    return returns;
  }
}

/**
 * export config parser
 *
 * @type {configParser}
 */
module.exports = new configParser ();