global.$ = $;
var folder_view = require('folder_view');
var path = require('path');
var shell = require('nw.gui').Shell;
var git = require('gift');
var gui = require('nw.gui');
var fs = require('fs');
var mime = require('mime');
var shell = require('nw.gui').Shell;
var jade = require('jade');

global.current_repo_path = "";
global.current_repo = null;

$(document).ready(function() {
  $(".navbutton").click(function(){
    $("#main-container").load($(this).attr('href'), function(){
      var folder = new folder_view.Folder($('#display_area'));
      folder.open(global.current_repo_path);
      fs.readdir(global.current_repo_path, function(error, files) {
        if (error) {
          console.log(error);
          window.alert(error);
          return;
        }

        var flag = 0;
        for (var i = 0; i < files.length; ++i) {
          files[i] = mime.stat(path.join(global.current_repo_path, files[i]));
          if(files[i]['name'] == ".git")
            flag = 1;
        }
        if(flag == 0){
          git.init(global.current_repo_path, function(err, _repo) {
            alert("Your project has succesfully been created!");
            var repo;
            return repo = _repo;
          });
        }
        else{
          global.current_repo = git(global.current_repo_path);
        }
      });
      folder.on('navigate', function(dir, mime) {
        if (mime.type == 'folder') {
          folder.open(mime);
        } else {
          shell.openItem(mime.path);
        }
      });
    });
    return false;
  });

  $(".quit-button").click(function(){
    gui.App.quit();
  });
});

var format_commits = jade.compile([
    '- each commit in commits',
    '  .commit',
    '    .commit-desc #{commit.message}',
    '    button.revert-button.btn(data-id="#{commit.id}") Revert to this version'
  ].join('\n'));
