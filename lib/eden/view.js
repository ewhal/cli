// Require local dependencies
const eden   = require('eden');
const config = require('config');

/**
 * Create View class
 */
class View {
  /**
   * Construct View class
   */
  constructor() {
    // Bind public methods
    this.render = this.render.bind(this);
  }

  /**
   * Create email template
   *
   * @param  {string} template
   * @param  {object} options
   *
   * @return {Promise}
   */
  async email(template, options) {
    const setOptions = { ...options };

    // Set config
    setOptions.config = {
      cdn    : config.get('cdn') || false,
      logo   : config.get('logo') || false,
      title  : config.get('title'),
      domain : config.get('domain'),
      socket : config.get('socket'),
    };

    // Run email compile hook
    await eden.hook('email.compile', setOptions);

    // Set compiled
    let compiled = false;

    // Create compile string
    await eden.hook('email.render', {
      setOptions,
      template,
    }, async () => {
      // Compile email
      compiled = await eden.email(template, setOptions);
    });

    // Return compiled email
    return compiled;
  }

  /**
   * Render view
   *
   * @param  {string}    path
   * @param  {object}    options
   * @param  {function}  callback
   *
   * @return {*}
   */
  async render(path, options, callback) {
    // Load req and res
    const { res } = options;
    const { req } = res;

    // Create remove array
    const remove = [
      'i18n', 'res', 'page', 'route', 'layout', '_locals', 'settings', 'head', 'routeStart', 'url', 'path', 'isJSON', 'timer',
    ];

    // Set route
    const route = options.route || {};

    // Run view route hook
    await eden.hook('view.route', route);

    // Set render Object
    const render = {
      page  : options.page,
      mount : {
        url    : options.url,
        path   : options.path || '404',
        page   : path,
        layout : (options.layout || route.layout || 'main'),
      },
      config : {
        cdn       : config.get('cdn') || false,
        logo      : config.get('logo') || false,
        title     : config.get('title'),
        domain    : config.get('domain'),
        socket    : config.get('socket'),
        direction : config.get('direction') || 2,
      },
      isJSON  : req.isJSON,
      session : req.sessionID,
    };

    // Set render timer
    render.timer = options.timer;

    // Check menus
    if (options.title) render.page.title = options.title;

    // Log timing
    eden.logger.log('debug', `${options.path} route in ${new Date().getTime() - render.timer.start}ms`, {
      class : (route && route.method) ? `${route.method.toUpperCase()} ${route.file}.${route.fn}` : 'No Route',
    });

    // Create state
    const state = {};

    // Loop options
    for (const key of Object.keys(options)) {
      // Check if in remove
      if (!remove.includes(key)) {
        // Add to state
        state[key] = options[key];
      }
    }

    // Run view state hook
    await eden.hook('view.state', state);

    // Set page state
    render.req = req;
    render.state = state;

    // Run view compile hook
    await eden.hook('view.compile', render);

    // Delete req
    delete render.req;

    // Check if is JSON
    if (options.isJSON) {
      // Sanitise for JSON
      delete render.timer;
      delete render.config;
      delete render.session;

      // Run view json hook
      await eden.hook('view.json', render);

      // Run callback
      return callback(null, JSON.stringify(render));
    }

    // Set render timer
    render.timer.render = new Date().getTime();

    // Do try/catch
    try {
      // Set page
      let page = '<!DOCTYPE html>';

      // Add to page
      page += `<html lang="${options.language}">`;
      page += '<head>';

      // Set head
      let head = '';

      // Run view head hook
      await eden.hook('view.head', head, () => {
        // Add to head
        head += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">';

        // Check config
        if (config.get('direction') === 0) {
          head += `<title>${render.page.title ? render.page.title : render.config.title}</title>`;
        } else if (config.get('direction') === 1) {
          head += `<title>${render.config.title}${render.page.title ? ` | ${render.page.title}` : ''}</title>`;
        } else {
          head += `<title>${render.page.title ? `${render.page.title} | ` : ''}${render.config.title}</title>`;
        }

        // Continue head
        head += render.page.style || '';
        head += `<link rel="stylesheet" href="${config.get('cdn.url') || '/'}public/css/app.min.css${config.get('version') ? `?v=${config.get('version')}` : ''}" data-eden="head-start" id="eden-prehead">`;
        head += render.page.head || '';
        head += '<meta name="eden" value="head-end" data-eden="head-end" id="eden-posthead">';
      });

      // Add head to page
      page += `${head}</head>`;
      page += `<body${render.page.class ? ` class="${render.page.class}"` : ''}>`;

      // Set compiled element
      let compiled = '';

      // Stringify user render
      const userFrontend = render.user ? JSON.stringify(render.user) : null;

      // Run view render hook
      await eden.hook('view.render', {
        req,
        res,
        render,
      }, async () => {
        // Compile view
        compiled = await eden.view(render);
      });

      // Delete user
      delete render.user;

      // Stringify render frontend
      const renderFrontend = JSON.stringify(render);

      // Add to page
      page += compiled;

      // Set foot
      let foot = '';

      // Run view foot hook
      await eden.hook('view.foot', ({
        render,
        foot,
      }), () => {
        // Delete session
        delete render.session;

        // Add to foot
        foot += `<!-- DATA.START --><script data-eden="before-user" id="eden-preuser">window.eden = JSON.parse (decodeURIComponent(atob("${Buffer.from(encodeURIComponent(renderFrontend)).toString('base64')}")));</script><!-- DATA.END -->`;
        foot += '<!-- USER.START -->';

        // Check user
        if (userFrontend) foot += `<script data-eden="before-script" id="eden-prescript">window.eden.user = JSON.parse(decodeURIComponent(atob("${Buffer.from(encodeURIComponent(userFrontend)).toString('base64')}")));</script>`;

        // Add to foot
        foot += '<!-- USER.END -->';
        foot += `<script data-eden="script" id="eden-script" type="text/javascript" src="${config.get('cdn.url') || '/'}public/js/app.min.js${config.get('version') ? `?v=${config.get('version')}` : ''}"></script>`;
        foot += render.page.script || '';
      });

      // Add foot to page
      page += `${foot}</body>`;
      page += '</html>';

      // Log rendered to debug
      eden.logger.log('debug', `${render.mount.path} rendered in ${new Date().getTime() - render.timer.start}ms`, {
        class : (route && route.method) ? `${route.method.toUpperCase()} ${route.file}.${route.fn}` : 'No Route',
      });

      // Run view rendered hook
      await eden.hook('view.rendered', {
        render,
        page,
      });

      // Run callback
      return callback(null, page);
    } catch (e) {
      // Run error
      eden.error(e);

      // Run callback
      return callback(e);
    }
  }
}

/**
 * Export view class
 *
 * @type {View}
 */
module.exports = new View();
