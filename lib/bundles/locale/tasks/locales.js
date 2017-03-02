
// require dependencies
const fs     = require ('fs-extra');
const glob   = require ('glob');
const path   = require ('path');
const extend = require ('object-extend');

/**
 * build locale task class
 *
 * @task locales
 */
class localesTask {
  /**
   * construct locale task class
   *
   * @param {edenGulp} runner
   */
  constructor (runner) {
    // set private variables
    this._runner = runner;

    // bind methods
    this.run   = this.run.bind (this);
    this.watch = this.watch.bind (this);
  }

  /**
   * run assets task
   *
   * @return {Promise}
   */
  run (files) {
    // return promise
    return new Promise ((resolve, reject) => {
      // grab locale files
      let Files = [];
      for (var a = 0; a < files.length; a++) {
        Files = Files.concat (glob.sync (files[a]));
      }

      // loop Locales
      let Locales = {};

      // loop files
      for (var b = 0; b < Files.length; b++) {
        // get locale
        let Locale = Files[b].split (path.sep);
            Locale = Locale[(Locale.length - 1)].split ('.')[0];

        // check locale exists
        if (!Locales[Locale]) Locales[Locale] = {};

        // extend
        extend (Locales[Locale], require (Files[b]));
      }

      // set locale folder
      let Folder = global.appRoot + path.sep + 'app' + path.sep + 'cache' + path.sep + 'locales';

      // create directory
      if (!fs.existsSync (Folder)) {
        // mkdir
        fs.mkdirSync (Folder);
      }

      // create files
      for (var Locale in Locales) {
        // remnove sync
        fs.unlinkSync (Folder + path.sep + Locale + '.json');

        // write file
        fs.writeFileSync (Folder + path.sep + Locale + '.json', JSON.stringify (Locales[Locale]));
      }

      // resolve
      resolve (true);
    });
  }

  /**
   * watch task
   *
   * @return {Array}
   */
  watch () {
    // return files
    return [
      'locales/*'
    ];
  }
}

/**
 * export locales task
 *
 * @type {localesTask}
 */
exports = module.exports = localesTask;