$(document).ready(function() {
  // define global variables
  const world = "";
  $('#bodycontent').load('home.html');
  RegisterEvents();
  
  
  // *********************
  // CUSTOM FUNCTIONS
  // Register events when body content changes
  function RegisterEvents() {
    $('#bodycontent').off();

    $('#bodycontent').on('click', '.app-link', function() {
      $('#bodycontent').load($(this).attr('data-page'));
      RegisterEvents();
    });

    $('#bodycontent').on('click', '.world-selection', function() {
      $(this).off();
      SelectWorld($(this).attr('data-world'));
    });
  }
  // Change the selected world
  function SelectWorld(world)
  {
    if (world!="")
    {
      $(document).prop('title', 'Velox Mundi: ' + world);
      $('#bodycontent').load('worldhome.html', function() {
        let el = document.getElementById('WorldName');
        el.innerText=world;
        RegisterEvents();
      });
    }
    else {
      $(document).prop('title', 'Velox Mundi');
      $('#bodycontent').load('home.html');
    }
    $('#world').text(world);
  }
  // END CUSTOM FUNCTIONS
  // ********************

  $('a.nav-link').on('click', function() {
    $('#bodycontent').load($(this).attr('data-page'));
    RegisterEvents();
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
});