//const { nodeName } = require("jquery");

//const { isNumeric } = require("jquery");

let pageDirty = false;
let modalLocked = false;
let modalVisible = false;
let setPageInConfig = true;
let pathSep = window.contextBridge.toMainSync('file', 'GetPathSep');
let typeSep = ' / ';
let loadToast = false;
let pageStatus = window.contextBridge.toMainSync('config', 'ReadKey', 'Status') ?? 'Ready';
let toastTimer = setTimeout(hideToast, 0);

// Bounce messages to Main
window.contextBridge.fromMain('bounceToMain', (event, module, method, data) => {
  window.contextBridge.toMain(module, method, data);
});

// Handle app messages
window.contextBridge.fromMain('appMessage', (event, action, data) => {
  switch(action) {
    case 'Error':
      $(document).ready(function() {
        if (data && data.errorTitle && typeof hideErrors!=='undefined' && hideErrors.includes(data.errorTitle)) {
            return;
        }
        let html = '<div><b>' + data.errorTitle + '</b></div>';
        if (data && data.messages) {
          for (let i=0; i<data.messages.length; i++) {
            html += '<div>' + data.messages[i].message + '</div>';
          }
        }
        showToast(html, 'text-danger', true);
      });
      break;
    default:
      break;
  }
});



const prefs = window.contextBridge.toMainSync('settings', 'Read', 'prefs');
const world = window.contextBridge.toMainSync('settings', 'Read', 'currentWorld');


function hideToast() {
  $('#closeToast').off();
  $('#toast').hide();
  $('#toast').html('');
}

function showToast(msg, clss, keepOpen) {
  clearTimeout(toastTimer);
  $('#toast').show();
  $('#toast').html('<div class="' + clss + '"><div class="float-right bi-x-circle-fill" id="closeToast">&nbsp</div>' + msg + '</div>');
  $('#closeToast').on('click', function() {
    hideToast();
  });
  if (!keepOpen) {
    toastTimer = setTimeout(hideToast, prefs.toastTimeout);
  }
}

function setPageDirty(isDirty) {
  pageDirty = isDirty;
}

function navigate(pagePath, qry) {
  if (!pageDirty || pagePath.startsWith('options_') || pagePath.startsWith('preview_')) {
    window.contextBridge.toMain('navigate', pagePath, qry);
  }
  else {
    modalLock(false);;
    showModal(
      {
        title: 'Unsaved changes', 
        body: '<p>Would you like to save your changes before leaving this page?', 
        footer: '<button id="CancelNavigation" class="btn btn-default">Cancel</button><button id="CancelAndNavigate" class="btn btn-danger">Don\'t Save</button><button id="SaveAndNavigate" class="btn btn-success">Save</button>',
        focus: '#SaveAndNavigate', 
        callback: function() {
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
    });
  }
}

function showModal({title, body, footer, focus, defaultButton, callback}) {
  if ($('#appModal').hasClass('show')) {
    $('#appModal').modal('hide').on('hidden.bs.modal', function() {
      showModal({title, body, footer, focus, defaultButton, callback});
      $('#appModal').off('hidden.bs.modal');
    });
  }
  else {
    $('#appModal').modal('show').on('shown.bs.modal', function() {
      $('#appModalError').text('');
      $('#appModalTitle').html('');
      $('#appModalBody').html('');
      $('#appModalFooter').html('');
      if (!title || title=='') {
        $('#appModalTitle').hide();
      }
      else {
        $('#appModalTitle').show();
        $('#appModalTitle').text(title);
      }
      if (!footer || footer=='') {
        $('#appModalFooter').hide();
      }
      else {
        $('#appModalFooter').show();
        $('#appModalFooter').html(footer);
      }
      $('#appModalBody').html(body);

      if (focus && focus!='') {
        //$('#appModal').data('focus',focus);
        $(focus).trigger('focus');
        if (defaultButton && defaultButton!='') {
          $(focus).on('keypress', function(event){
            //var keycode = (event.key==='Enter' || event.key==='NumberpadEnter');
            if(event.key==='Enter' || event.key==='NubmerpadEnter'){
                $(defaultButton).trigger('click');
            }
          });
        }
      }
      else {
        if (defaultButton && defaultButton!='') {
          $(document).on('keypress', function(event){
            //var keycode = ();
            if(event.key==='Enter' || event.key==='NubmerpadEnter'){
                $(defaultButton).trigger('click');
            }
          });
        }
      }
      modalLock(modalLocked);
      if (callback) {
        callback();
      }
      $('#appModal').off('shown.bs.modal');
    });  
  }
}

function hideModal() {
  $('#appModal').modal('hide').on('hidden.bs.modal', function() {    
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
    $('#appModalError').text('');
    $('#appModalTitle').html('');
    $('#appModalBody').html('');
    $('#appModalFooter').html('');
    $('#appModal').off('hidden.bs.modal');
  });
  
}

function setDefaultAppModalHidden() {
  $('#appModal').on('hidden.bs.modal', function() {      
    $('#appModalError').text('');
    $('#appModalTitle').html('');
    $('#appModalBody').html('');
    $('#appModalFooter').html('');
    $('#appModal').off('shown.bs.modal');
  });
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

function setStatus(status, duration, persist) {
  if (status && status!='') {
    $('#statusbar').text(status);
    if (duration) {
      if (duration==0) {
        duration=3000;
      }
      try {
        setTimeout(() => {
          setStatus('Ready');
        }, duration);
      }
      catch {}
    }
    if (persist) {
      window.contextBridge.toMainSync('config', 'WriteKey', ['status',status]);
    }
  }
  else {
    let status = window.contextBridge.toMainSync('config', 'ReadKey', 'Status');
    if (!status || status=='') {
      status = 'Ready';
    }
    $('#statusbar').text(status);
  }
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
  $('#page-content').prepend('<div class="modal fade" id="appModal" tabindex="-1" role="dialog" aria-labelledby="appModalTitle" aria-hidden="true" data-backdrop="static" data-keyboard="false"><div class="modal-dialog modal-dialog modal-sm" role="document"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="appModalTitle"></h5><button id="appModalClose" type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div><div class="modal-body"><div id="appModalError" class="text-danger"></div><div id="appModalBody">' + '' + '</div></div><div class="modal-footer" id="appModalFooter"></div></div></div></div><button id="appModalShow" data-toggle="modal" data-target="#appModal" style="display:none"></button>');
  // Add "toast" div to every page
  $('body').prepend('<div id="toast" style="z-index:1000"></div>\r\n');
  setStatus();

  // Add status bar to every page
  $('#page-content').after('<div id="statusbar"><div>');
  setStatus();

  // Monitor modal status
  /*
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
  */
  
  // close navbar menu after clicking a link
  $(".navbar-collapse a").on('click', function () {
    $(".navbar-collapse").collapse("hide");
  });


  /*
  // modal handling...allows multiple modals
  $('.modal').on('hidden.bs.modal', function(event) {
      $(this).removeClass( 'fv-modal-stack' );
      $('body').data( 'fv_open_modals', $('body').data( 'fv_open_modals' ) - 1 );
  });

  /*
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
  */
  

  // Handle menu actions
  window.contextBridge.fromMain('status', (event, status, duration, persist) => {
    setStatus(status, duration, persist);
  });
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
        window.contextBridge.toMainSync('settings', 'Write', ['currentWorld', '']);
        navigate('selectWorld.html');
        break;
      case 'ScanWorld':
        window.contextBridge.toMain('world', 'ScanDir');
          break;
      case 'PageBack':
        window.history.go(-1);
        break;
      case 'PageForward':
        window.history.go(+1);
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
        navigate('new');
        break;
      case 'Wizard':
        window.contextBridge.toMain('WizardWindow', data);
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
  });




  // testing
  //console.log('CurrentWorldDirectory: ' + window.contextBridge.toMainSync('test'));
});





