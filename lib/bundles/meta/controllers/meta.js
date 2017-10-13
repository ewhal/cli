// use strict
'use strict';

// require dependencies
const config     = require ('config');
const controller = require ('controller');

/**
 * build meta controller
 */
class metaController extends controller {
  /**
   * construct example controller class
   */
  constructor () {
    // run super eden
    super ();

    // bind private methods
    this._compile    = this._compile.bind (this);
    this._middleware = this._middleware.bind (this);

    // run middleware
    this.eden.router.use (this._middleware);

    // on render
    this.eden.pre ('view.compile', this._compile);
  }

  /**
   * compile view
   *
   * @param  {Object}  render
   *
   * @return {Promise}
   */
  async _compile (render) {
    // check meta
    let meta = render.state.meta || {};

    // delete meta
    delete render.state.meta;

    // create head
    if (!render.page.head) render.page.head = '';

    // loop meta
    for (let type in meta) {
      // loop for name
      for (let name in meta[type]) {
        // add to head
        render.page.head += '<' + type;

        // loop for tags
        for (let tag in meta[type][name]) {
          // add tag
          render.page.head += ' ' + tag + '="' + meta[type][name][tag] + '"';
        }

        // close tag
        render.page.head += ' />';
      }
    }
  }

  /**
   * build middleware
   *
   * @param  {request}  req Express request
   * @param  {response} res Express response
   * @param  {function} next Next callback
   *
   * @private
   */
  async _middleware (req, res, next) {
    // create meta function
    req.meta = res.meta = (type, opts) => {
      // check type and opts
      if (typeof type === 'object' || !opts) {
        // set variables
        opts = type;
        type = 'meta';
      }

      // get name
      let name = opts.name || opts.property || opts[Object.keys (opts)[0]];

      // check type
      if (type === 'title')       return req.title (opts);
      if (type === 'image')       return req.image (opts);
      if (type === 'description') return req.description (opts);

      // check opts
      if (typeof opts === 'string') {
        opts = {
          'name'    : type,
          'content' : opts
        };
        type = 'meta';
      }

      // check if meta exists
      if (!res.locals.meta) res.locals.meta = {};

      // check meta type
      if (!res.locals.meta[type]) res.locals.meta[type] = {};

      // set meta
      res.locals.meta[type][name] = opts;

      // return req
      return res;
    };

    // create description
    req.og = res.og = (name, content) => {
      // add description
      req.meta ({
        'property' : 'og:' + name,
        'content'  : content
      });

      // return req
      return res;
    };

    // create description
    req.twitter = res.twitter = (name, content) => {
      // add description
      req.meta ({
        'name'    : 'twitter:' + name,
        'content' : content
      });

      // return req
      return res;
    };

    // create description
    req.title = res.title = (title) => {
      // set title
      res.locals.page = res.locals.page || {};

      // set title
      res.locals.page.title = title;

      // add description
      req.og ('title', title);
      req.twitter ('title', title);

      // return req
      return res;
    };

    // create description
    req.description = res.description = (description) => {
      // add description
      req.og ('description', description);
      req.twitter ('description', description);

      // return req
      return res;
    };

    // create description
    req.image = res.image = (url) => {
      // add image
      req.og ('image', url);
      req.twitter ('image', url);

      // return req
      return res;
    };

    // set default title
    req.title (config.get ('title'));

    // set default
    req.og ('url', '//' + config.get ('domain') + req.url);
    req.og ('locale', req.language);
    req.twitter ('card', 'summary');
    req.twitter ('site', config.get ('title'));

    // run next
    next ();
  }
}

/**
 * export meta controller
 *
 * @type {metaController}
 */
exports = module.exports = metaController;