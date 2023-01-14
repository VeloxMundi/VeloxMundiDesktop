
const prefs = window.contextBridge.toMainSync('config', 'ReadKey', 'prefs');
const world = window.contextBridge.toMainSync('config', 'ReadKey', 'CurrentWorld');
let pageDirty = false;

function hideToast() {
  $('#closeToast').off();
  $('#toast').hide();
  $('#toast').html('');
}

function showToast(msg, clss) {
  $('#toast').show();
  $('#toast').html('<div class="' + clss + '"><div class="float-right bi-x-circle-fill" id="closeToast">&nbsp</div>' + msg + '</div>');
  $('#closeToast').on('click', function() {
    hideToast();
  });
  setTimeout(hideToast, prefs.toastTimeout);
}

function setPageDirty(isDirty) {
  pageDirty = isDirty;
}

function navigate(pagePath) {
  if (!pageDirty) {
    window.contextBridge.toMain('navigate', pagePath);
  }
  else {
    showToast('Page not saved', 'text-danger');
  }
}



$(document).ready(function() {
  // Set page
  let pageName = window.location.pathname.split('/').pop();
  window.contextBridge.toMain('ui', 'SetMenu', pageName);
  
  if (window.location.search.length>1) {
    pageName += '?' + window.location.search.substring(1);
  }
  
  window.contextBridge.toMain('config', 'SetPage', pageName);
  
  // Display the world name in any element with the class "WorldName"
  if ($('.WorldName').length) {
    $('.WorldName').text(world);
  }

  /*
  // Display world name in any element with the id "homeLink"
  if (world && world!='') {
    $('#homeLink').html('<span class="bi-globe"></span>&nbsp;' + world);
  }
  */
  
  // Add "toast" div to every page
  $('body').prepend('<div id="toast" style="z-index:1000"></div>\r\n');

  // close navbar menu after clicking a link
  $(".navbar-collapse a").on('click', function () {
    $(".navbar-collapse").collapse("hide");
  });
  // modal handling...allows multiple modals
  $('.modal').on('hidden.bs.modal', function(event) {
      $(this).removeClass( 'fv-modal-stack' );
      $('body').data( 'fv_open_modals', $('body').data( 'fv_open_modals' ) - 1 );
  });

  $('.modal').on('shown.bs.modal', function (event) {
      // keep track of the number of open modals
      if ( typeof( $('body').data( 'fv_open_modals' ) ) == 'undefined' ) {
          $('body').data( 'fv_open_modals', 0 );
      }

      // if the z-index of this modal has been set, ignore.
      if ($(this).hasClass('fv-modal-stack')) {
          return;
      }

      $(this).addClass('fv-modal-stack');
      $('body').data('fv_open_modals', $('body').data('fv_open_modals' ) + 1 );
      $(this).css('z-index', 1040 + (10 * $('body').data('fv_open_modals' )));
      $('.modal-backdrop').not('.fv-modal-stack').css('z-index', 1039 + (10 * $('body').data('fv_open_modals')));
      $('.modal-backdrop').not('fv-modal-stack').addClass('fv-modal-stack');

  });

  // Handle menu actions
  window.contextBridge.fromMain('menu', (event, action, data) => {
    switch(action) {
      case 'Home':
        if (world && world!='') {
          navigate('worldHome.html');
        }
        else {
          navigate('index.html');
        }
        break;
      case 'Navigate':
        navigate(data);
        break;
      case 'CloseWorld':
        window.contextBridge.toMainSync('config', 'WriteKey', ['CurrentWorld', '']);
        navigate('selectWorld.html');
        break;
      case 'ExitApp':
        if (!pageDirty) {
        window.contextBridge.toMainSync('quit');
        }
        else {
          showToast('Page has been modified.', 'text-danger');
        }
        break;
      case 'NewPage':
        navigate('edit.html');
        break;
      default:
        break;
    }
  });

  window.contextBridge.fromMain('navigate', (event, pagePath) => {
    navigate(pagePath);
  });


  // Handle errors
  window.contextBridge.fromMain('error', (event, message) => {
    showToast(message, 'text-danger');
  })
});