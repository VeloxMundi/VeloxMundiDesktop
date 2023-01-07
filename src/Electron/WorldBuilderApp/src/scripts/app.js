
let prefs = window.contextBridge.toMainSync('config', 'ReadKey', 'prefs');
let world = window.contextBridge.toMainSync('config', 'ReadKey', 'CurrentWorld');

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

function SetCurrentPageInBreadcrumbs(pageName) {
  $('#breadcrumbs').append(' <span class="bi-arrow-right-short">&nbsp;</span> <span class="nolink not-allowed" id="thisWorld"><i>' + pageName.replace('Velox Mundi: ', '') + '</i></span>');
}

$(document).ready(function() {
  // Set page
  let pageName = window.location.pathname.split('/').pop();
  
  if (window.location.search.length>1) {
    pageName += '?' + window.location.search.substring(1);
  }
  
  window.contextBridge.toMain('config', 'SetPage', pageName);
  
  if (world && world!='') {
    $('body').prepend('<div id="SelectWorldLink" style="float:right"><a href="../pages/selectWorld.html" title="Change World"><span class="bi-globe"></span>&nbsp;Change World</a></div>');
  }
  if ($('.WorldName').length) {
    $('.WorldName').text(world);
  }

  
  if (world && world!='') {
    $('#homeLink').html('<span class="bi-globe"></span>&nbsp;' + world);
  }
  
  

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
});