$(document).ready(function() {
  // define global variables
  let world = "";
  $('#bodycontent').load('home.html');
  RegisterEvents();


  // *********************
  // CUSTOM FUNCTIONS
  // Register events when body content changes
  function RegisterEvents() {
    $('#bodycontent').off();

    let pageId = $('#bodycontent #PageId');
    if (pageId)
    {
      switch (pageId.val())
      {
        case "Edit":
          let editor = $('#bodycontent #editor');
          editor.load("sample.md");
          break;
      }
    }

    $('#bodycontent').on('click', '.app-link', function() {
      loadPage($(this).attr('data-page'));
    });

    $('#bodycontent').on('click', '.world-selection', function() {
      $(this).off();
      SelectWorld($(this).attr('data-world'));
    });

    $('#bodycontent').on('click', '#SelectWorldPath', function(e) {
      e.preventDefault();
      let directory = window.contextBridge.toMainSync('selectWorldDirectory');
      if (directory!='') {
        $('#WorldPath').text(directory);
      }
    });

    $('#bodycontent').on('click', '#btn1', function() {
      $('#box').val('B1 pressed...');
      let ret = window.contextBridge.toMainWithReply('B1');
      $('#box').val(ret);
    });
    $('#bodycontent').on('click', '#btn2', function() {

    });

    $('#bodycontent').on('click', '#SaveNewWorld', function() {
      let worldName = $('#NewWorldName').val();
      let world = window.contextBridge.toMainSync('CreateWorld', worldName);
      if (world!='') {
        $('#ErrorMsg').text(world);
      }
      else {
        SelectWorld(worldName);
      }
        
    });

    $('#bodycontent').on('load', function() {
      let pageId = $('#PageId');
      if (pageId)
      {
        switch (pageId.val())
        {
          case "Edit":
            let editor = $('#bodycontent #editor');
            editor.load("sample.md");
            break;
        }
      }
    });
  }
  // Change the selected world
  function SelectWorld(world)
  {
    if (world!="")
    {
      window.contextBridge.toMain('setWorld', world);
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

  function loadPage(pageName)
  {
    $('#bodycontent').load(pageName, function() {
      switch(pageName)
      {
        case "selectworld.html":
          document.getElementById('WorldList').innerHTML = "";
          let world = document.getElementById('world').innerText;
          if (world !="") {
            document.getElementById('WorldList').innerHTML = `<li id="ClearWorld"><a href="#" class="world-selection text-danger" data-world="">[Clear "${world}"]</a></li>`;
          }
          let worlds = window.contextBridge.listWorlds();
          break;
        case "config.html":
          let configData = window.contextBridge.toMainSync('loadConfig');
          if (configData["WorldDirectory"]) {
            $('#WorldPath').text(configData["WorldDirectory"]);
          }
          let f=1;
          break;
        case "edit.html":
          let params = new URLSearchParams(document.location.search);
          let pageSource = params.get("source");
          break;
      }
      RegisterEvents();
    });

  }
  // END CUSTOM FUNCTIONS
  // ********************

  // ********************
  // LISTEN FOR MESSAGES FROM MAIN
  window.contextBridge.fromMain('listWorlds', (event, worlds) => {
    const list = document.getElementById('WorldList');
    let newHTML = "";
    worlds.forEach(world => {
      for (let key in world)
      {
        if (key=="name")
        {
        list.innerHTML += `<li><a href="#" class="world-selection" data-world="${world[key]}">${world[key]}</a></li>`;
        }
      }
    });

  });
  // END LISTEN FOR MESSAGES FROM MAIN
  // *********************

  $('a.nav-link').on('click', function() {
    loadPage($(this).attr('data-page'));
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