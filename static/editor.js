var flag = 0;
var startPos;
var endPos;
var startlang;
var endlang;
var selectedText;
var offsets = [];
var offsetslength = 0;
var syns= new Array(5);
synFlag = 0;
var numOfSynSugg = 0;//Donot change for lang suggestion
//capture selected text
function captureText(){
  var textComponent = document.getElementById('editor');
  if (textComponent.selectionStart !== undefined) {// Standards Compliant Version
    startPos = textComponent.selectionStart;
    endPos = textComponent.selectionEnd;
    selectedText = textComponent.value.substring(startPos, endPos);
  }
  else if (document.selection !== undefined) {// IE Version
    textComponent.focus();
    var sel = document.selection.createRange();
    selectedText = sel.text;
  }
  synFlag = 1;
  //alert("You selected: " + selectedText);
  deletePrev();
  generateSyns(selectedText);
}

//delete previously generated suggestions
function deletePrev(){
  if(flag == 1){
    for(i=0;i<numOfSynSugg;i++){
      var elem = document.getElementById(i);
      elem.parentNode.removeChild(elem);
    }
    numOfSynSugg = 0;
  }
}

//generate new suggestions
function generateSyns(selectedText) {
  data = {"word" : selectedText}
  //console.log(data)
  $.ajax('/check', {
    type: "POST",
    contentType: "application/json",
    dataType: "json",
    data: JSON.stringify(data),
    success: function(data, status){
        console.log(data)
        console.log(typeof data[0]);
        console.log(data[0] == "notavailable");
        if(data[0] === "notavailable"){
          console.log(data[0])
          var parent = document.getElementById('synonym-parent');
          var x = document.createElement("DIV");
          var t = document.createTextNode("No suggestion available.");
          x.appendChild(t);
          x.classList.add("row");
          x.classList.add("suggestion");
          x.setAttribute("onclick","deleteSynElement(this)");//deleteLangElement deletes the div
          x.id = 0;
          parent.appendChild(x);
          numOfSynSugg++;

        }
        else {
        var i;
        var list = document.getElementById('list');
        console.log(syns)
        //syns = JSON.stringify(syns);
        for(i=0;i<5;i++){
          var parent = document.getElementById('synonym-parent');
          var x = document.createElement("DIV");
          var s = data[i].split('"')
          var t = document.createTextNode(s);
          x.appendChild(t);
          x.classList.add("row");
          x.classList.add("suggestion");
          x.setAttribute("onclick","substitute(this)");
          x.id = i;
          parent.appendChild(x);
          numOfSynSugg++;
        }
      }
        //console.log(data)
        /*console.log(status)*/}
});

flag = 1;
}

function substitute(element){
  syn = element.textContent;
  var textComponent = document.getElementById('editor');
  newText = textComponent.value.substring(0, startPos)+syn+textComponent.value.substring(endPos,textComponent.value.length);
  selectedWordCurrent = textComponent.value.substring(startPos,endPos);
  endPos = startPos+syn.length;
  console.log(newText);
  textComponent.value = newText;
  console.log(textComponent.value.substring(startPos,endPos));
  element.textContent = selectedWordCurrent;
}

function langCheck(){
  var editor = document.getElementById('editor');
  var text = editor.value;
  $.ajax('/grammarCheck', {
    type: "POST",
    contentType: "application/json",
    dataType: "json",
    data: JSON.stringify(text),
    success: function(data, status){
    offsets = []
    offsetslength = 0;
    var i;
    var list = document.getElementById('list');
    for(i=0;i<data.length;i++){
          var parent = document.getElementById('synonym-parent');
          var x = document.createElement("DIV");
          //Create msg node
          var mn = document.createElement("DIV");
          var mntext = document.createTextNode(data[i].msg+":");
          mn.appendChild(mntext);
          //create replacement text wala node
          var replace = document.createElement("DIV");
          var rp = "";
          for (j=0;j<data[i].replacements.length;j++){
            if(j==data[i].replacements.length-1)
              rp+=data[i].replacements[j];
            else
              rp+=data[i].replacements[j]+"/ ";
          }
          offsets[i+"/"] = {offset: data[i].offset, errorL: data[i].errorlength}
          offsetslength++;
          var rptext = document.createTextNode('Replace with: "'+rp+'"?');
          console.log(rp);
          replace.appendChild(rptext);
          x.appendChild(mn);
          if(data[i].replacements.length>0){
            console.log(data[i].replacements)
            x.appendChild(replace);

            var u = document.createElement("DIV");
            var uText = document.createElement('I');
            uText.setAttribute("class","fa fa-check icon-style")
            u.appendChild(uText);
            u.setAttribute("onclick","langReplace(this.parentNode)");
            u.setAttribute("style","padding: 5px 5px; display: block;");
            x.appendChild(u);
            //x.setAttribute("onclick","langReplace(this)");
          }
//<i class="fa fa-check" aria-hidden="true"></i>

          if(data[i].replacements.length == 0){
            x.setAttribute("onclick","deleteLangElement(this)")
          }
          //
          /*var u = document.createElement("DIV");
          var uText = document.createTextNode("use");
          u.appendChild(uText);
          u.setAttribute("onclick","langReplace(this)");
          x.appendChild(u);*/

          var d = document.createElement("DIV");
          var dText = document.createElement("I");
          dText.setAttribute("class","fa fa-times icon-style")
          d.appendChild(dText);
          d.setAttribute("style","padding: 5px 5px;")
          d.setAttribute("onclick","dismissLangElement(this)");
          x.appendChild(d);

          //
          x.classList.add("row");
          x.classList.add("grammar");
          x.setAttribute("onmouseover","langHighlight(this)");
          x.setAttribute("data-startselect",data[i].offset)
          x.setAttribute("data-endselect",data[i].offset+data[i].errorlength)
          x.setAttribute("data-endselect",data[i].offset+data[i].errorlength)
          x.setAttribute("data-replacements",rp)
          x.id = i+"/";
          parent.appendChild(x);
        }
    }
  });
}

function langHighlight(element){
  console.log(element.id)
  startlang = offsets[element.id].offset;
  endlang = offsets[element.id].offset+offsets[element.id].errorL;
  var editor = document.getElementById("editor")
  editor.focus();
  editor.setSelectionRange(startlang,endlang);
}

function langReplace(element){
  var textComponent = document.getElementById('editor');
  replacements = element.dataset.replacements;
  replacements = replacements.split("/");
  currentOffset = offsets[element.id].offset;
  if(replacements.length == 1){
    newText = textComponent.value.substring(0, startlang)+replacements[0]+textComponent.value.substring(endlang,textComponent.value.length);
    var delta = replacements[0].length-(endlang-startlang)
    }
  else {
    userRep = prompt("Select one/Input your own word: "+replacements);
    newText = textComponent.value.substring(0, startlang)+userRep+textComponent.value.substring(endlang,textComponent.value.length);
    var delta = userRep.length-(endlang-startlang);
  }
  var k;
  for(k=parseInt(element.id.split("/"));k<offsetslength;k++){
      if(offsets[k.toString()+"/"].offset>currentOffset){
        offsets[k.toString()+"/"].offset+=delta;
      }
    }
  textComponent.value = newText;
  element.parentNode.removeChild(element);


}
function deleteLangElement(element){
element.parentNode.removeChild(element);
}

function dismissLangElement(element){
  var sug = element.parentNode;
  sug.parentNode.removeChild(sug);

}

function deleteSynElement(element){
element.parentNode.removeChild(element);
numOfSynSugg--;
}

function userDeletesSuggestion(cross){
var id = cross.parentNode.id;
element = document.getElementById(id);
element.parentNode.removeChild(element);
}

function saveTextAsFile()
       {
           var textToWrite = document.getElementById('editor').value;
           var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
           var fileNameToSaveAs = "ecc.txt";

           var downloadLink = document.createElement("a");
           downloadLink.download = fileNameToSaveAs;
           downloadLink.innerHTML = "Download File";
           if (window.webkitURL != null)
           {
               // Chrome allows the link to be clicked
               // without actually adding it to the DOM.
               downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
           }
           else
           {
               // Firefox requires the link to be added to the DOM
               // before it can be clicked.
               downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
               downloadLink.onclick = destroyClickedElement;
               downloadLink.style.display = "none";
               document.body.appendChild(downloadLink);
           }

           downloadLink.click();
       }

       var button = document.getElementById('save');
       button.addEventListener('click', saveTextAsFile);


