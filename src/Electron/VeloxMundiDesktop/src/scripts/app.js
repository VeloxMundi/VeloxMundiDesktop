
const prefs = window.contextBridge.toMainSync('config', 'ReadKey', 'prefs');
const world = window.contextBridge.toMainSync('config', 'ReadKey', 'CurrentWorld');
let pageDirty = false;
let modalLocked = false;
let modalVisible = false;
let setPageInConfig = true;

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
    if (!modalVisible) {
      window.contextBridge.toMain('navigate', pagePath);
    }
    else {
      $('#appModalError').text('There are unsaved changes.');
    }
  }
  else {
    modalLock(false);
    showModal('Unsaved changes', '<p>Would you like to save your changes before leaving this page?', '<button id="CancelNavigation" class="btn btn-default">Cancel</button><button id="CancelAndNavigate" class="btn btn-danger">Don\'t Save</button><button id="SaveAndNavigate" class="btn btn-success">Save</button>');
    $('#CancelNavigation').on('click', function() {
      modalLock(false);
      hideModal();
    });
    $('#CancelAndNavigate').on('click', function() {
      modalLock(false);
      pageDirty=false;
      hideModal();
      navigate(pagePath);
    });
    $('#SaveAndNavigate').on('click', function() {
      modalLock(true);
      window.contextBridge.toMain('return', 'SaveAndNavigate', pagePath);
    });
  }
}

function showModal(title, body, footer, focus, defaultButton) {
  modalLock(modalLocked);
  if (!title || title=='') {
    $('#appModalTitle').hide();
  }
  if (!footer || footer=='') {
    $('#appModalFooter').hide();
  }
  else {
    $('#appModalFooter').show();
    $('#appModalFooter').html(footer);
  }
  $('#appModalTitle').text(title);
  $('#appModalBody').html(body);
  $('#appModalShow').trigger('click');
  if (focus && focus!='') {
    $('#appModal').data('focus',focus);
    if (defaultButton && defaultButton!='') {
      $(focus).on('keypress', function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            $(defaultButton).trigger('click');
        }
      });
    }
  }
  else {
    if (defaultButton && defaultButton!='') {
      $(document).on('keypress', function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            $(defaultButton).trigger('click');
        }
      });
    }
  }
}

function hideModal() {
  $('#appModalClose').prop('disabled',modalLocked);
  if (modalLocked) {
    $('#appmodalClose').hide();
  }
  else {
    $('#appmodalClose').show();
  }
  // Remove on-click event handlers for all buttons
  $('#appModalFooter button').each(function() {
    $(this).off();
  });
  $('#appModalClose').trigger('click');
  let isvis = $('#appModal').is(':visible');
}

function modalLock(locked) {
  modalLocked = locked;
  if (modalLocked) {
    $('#appModalClose').prop('disabled',true);
    $('#appModalClose').hide();
  }
  else {
    $('#appModalClose').prop('disabled',false);
    $('#appmodalClose').show();
  }
}

function modalOnEnter(elementToMonitor,defaultButton) {
  // Write a function that will monitor "elementToMonitor" for pressing [Enter] and will trigger a click on the defaultButton object
  
}

function HandleNavLinks() {
  $('a.navLink').on('click', function() {
    let page = $(this).data('page');
    let query = $(this).data('query');
    window.contextBridge.toMain('navigate', page, query);
  });
}

$(document).ready(function() {
  // Set page
  let pageName = window.location.pathname.split('/').pop();
  window.contextBridge.toMain('ui', 'SetMenu', pageName);
  
  if (window.location.search.length>1) {
    pageName += '?' + window.location.search.substring(1);
  }
  
  if (setPageInConfig) {
    window.contextBridge.toMain('config', 'SetPage', pageName);
  }
  
  // Display the world name in any element with the class "WorldName"
  if ($('.WorldName').length) {
    $('.WorldName').text(world);
  }

  HandleNavLinks();
  
  // Add modal div to every page
  $('body').prepend('<div class="modal fade" id="appModal" tabindex="-1" role="dialog" aria-labelledby="appModalTitle" aria-hidden="true" data-backdrop="static" data-keyboard="false"><div class="modal-dialog modal-dialog-centered modal-sm" role="document"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="appModalTitle"></h5><button id="appModalClose" type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div><div class="modal-body"><div id="appModalError" class="text-danger"></div><div id="appModalBody">' + '' + '</div></div><div class="modal-footer" id="appModalFooter"></div></div></div></div><button id="appModalShow" data-toggle="modal" data-target="#appModal" style="display:none"></button>');
  // Add "toast" div to every page
  $('body').prepend('<div id="toast" style="z-index:1000"></div>\r\n');


  // Monitor modal status
  $(document).on('shown.bs.modal', '#appModal', function () {
      // run your validation... ( or shown.bs.modal )
      modalVisible = true;
      let focus = $('#appModal').data('focus');
      if (focus && focus!='') {
        let focalItem = $(focus);
        //$(focus).focus();
        $(focus).trigger('focus');
      }
  });
  $(document).on('hide.bs.modal', '#appModal', function () {
    // run your validation... ( or shown.bs.modal )
    modalVisible = false;
  });

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