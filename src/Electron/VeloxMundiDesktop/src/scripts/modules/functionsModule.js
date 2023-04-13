const app = require('electron');
const path = require('path');
const appConfig = require('electron-settings');


module.exports = {
  SortDotSeparated: (array) => {
    return array.sort(function(a, b) {
      if (!a || a=='' || a==0) {
        a = '0.0.0';
      }
      if (!b || b=='' || b==0) {
        b.data.sortOrder='0.0.0';
      }
      let asort = a.split('.');
      let bsort = b.split('.');
      let sorted = false;
      let i=0;
      try {
        while (i<asort.length && i<bsort.length) {
            let at = parseInt(asort[i]) || 0;
            let bt = parseInt(bsort[i]) || 0;
            if (at<bt) {
              sorted=true;
              return -1;
            }
            else if (bt<at) {
              sorted=true;
              return 1;
            }
            i++;
        }
      }
      catch {
        return 0;
      }
    });
  }
}