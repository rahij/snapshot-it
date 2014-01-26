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
exec = require('child_process').exec;

global.current_repo_path = "";
global.current_repo = null;
global.current_rev  = "";
global.folder = null;
global.selected_commit = "";

$(document).ready(function() {
  $(".navbutton").click(function(){
    $("#main-container").load($(this).attr('href'), function(){
      global.folder = new folder_view.Folder($('#display_area'));
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
            global.current_repo = git(global.current_repo_path);
            global.current_repo.add(".", function(err){
              global.current_repo.commit("first draft", function(err, commits) {
                render_commits();
                var repo;
                return repo = _repo;
              });
            });
          });
        }
        else{
          global.current_repo = git(global.current_repo_path);
          render_commits();
        }
      });
      global.folder.on('navigate', function(dir, mime) {
        if (mime.type == 'folder') {
          global.folder.open(dir);
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
    'a#unsaved-changes-button(data-toggle="collapse", data-target="#diff") Uncaptured Changes&nbsp;&nbsp;',
    ' i.icon-chevron-down',
    '#diff.collapse.in !{commits.diff}',
    'h4 Recent Snapshots',
    '#commits',
    '- each commit in commits',
    ' - var d = new Date(1000 * +commit["committed_date"])',
    ' - var df = d.getDate() + "/" + (d.getMonth()+1) + "/" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes()',
    '   .commit.btn.btn-block(id="#{commit.id}", data-desc="#{commit.message}")',
    '     span.label.label-info #{df}',
    '     span.commit-desc #{commit.message}',
    '     if commits.head == commit.id',
    '       span.badge.badge-success Current Version',
  ].join('\n'));

var generate_commit_details = jade.compile([
    'button.revert-button.btn.btn-danger.btn-large.btn-block(data-id="#{commit_id}") Jump to this version',
    '#commit-od-wrapper',
    ' h3.commit-desc-panel #{commit_message}',
    ' h5.side-panel-header Changes',
    ' #commit-diff !{diff}'
  ].join('\n'));

function render_commits(){
  global.current_repo.commits(function(err, commits) {
    var bash = "git rev-parse HEAD";
    exec(bash, {cwd: global.current_repo_path}, function(error, stdout, stderr){
      global.current_rev  = stdout.replace(/^\s+|\s+$/g, '');
      commits['head'] = global.current_rev;
      exec("git add . --all && git diff HEAD", {cwd: global.current_repo_path}, function(error, stdout, stderr){
        commits['diff'] = stdout.replace(/\n/g, '<br />');
        commits['diff'] = commits['diff'] == "" ? "No changes" : commits['diff'];
        $("#display_area").html(format_commits({"commits" : commits}));
        if(global.selected_commit == "")
          global.selected_commit = $(".commit").first().attr('id');
        $("#"+global.selected_commit).click();
      });
    });
  });
}