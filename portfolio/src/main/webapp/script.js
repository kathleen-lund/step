// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Adds a random fact to the page.
 */
function addRandomFact() {
  const facts =
      ['I love hot cheetos.', 'Purple is my favorite color.', 
      'I\'m horrible at remembering song lyrics.', 'I speak some French.'];

  // Pick a random fact.
  const fact = facts[Math.floor(Math.random() * facts.length)];

  // Add it to the page.
  const factContainer = document.getElementById('fact-container');
  factContainer.innerText = fact;
}

/**
 * Shows the specified blog post to the user
 * @param {number} postNum The number of which
 * blog post to show.
 */
function showBlogPost(postNum) {
  // Find the correct triangle to expand and switch its image.
  // Also change the onclick function for this button to hide the post.
  const buttonId = "expandTriangle" + postNum;
  document.getElementById(buttonId).src = "/images/downtriangle.jpeg";
  document.getElementById(buttonId).onclick = function() {
    hideBlogPost(postNum);
  };

  // Add blog post content to the correct area.
  const blogPostId = "blogPostArea" + postNum;
  if (postNum===1) {
      // Append paragraph to DOM.
    let pTag = document.createElement("p");
    pTag.appendChild(document.createTextNode('I have a secret love for ' +
        'bucket balls. Not only am I randomly good at tossing balls in ' +
        'incrementally spaced buckets, but I\'ve had lots of opportunity to ' +
        'do so. Some of my fondest memories are tossing softballs back ' +
        'into the ball bucket from many yards away at the end of practice, ' +
        'to the delight of my teammates.'));
    document.getElementById(blogPostId).appendChild(pTag);

    // Append image to DOM.
    let imgTag = document.createElement("img");
    imgTag.src = "/images/bucketballs.png";
    document.getElementById(blogPostId).appendChild(imgTag);
  }
  if (postNum===2) {
    // Append paragraph to DOM.
    let pTag = document.createElement('p');
    pTag.appendChild(document.createTextNode('My fingers are very ' +
        'double-jointed. I can bend them all downward at the first joint ' +
        'behind the nail, and my thumbs bend backwards in a hitchhiker\'s ' +
        'thumb position. This double-jointedness actually makes it a bit ' +
        'difficult to play the cello, as collapsing joints are a big no-no ' + 
        'for your left hand.'));
    document.getElementById(blogPostId).appendChild(pTag);
  }

  // Automatically scroll window with post now opened.
  window.scrollBy(0, 500);
}

/**
 * Hides the specified blog post from the user
 * @param {number} postNum The number of which
 * blog post to hide.
 */
function hideBlogPost(postNum) {
  // Find the correct triangle to hide and switch its image.
  // Also change the onclick function for this button to show the post.
  const buttonId = "expandTriangle" + postNum;
  document.getElementById(buttonId).src = "/images/righttriangle.jpeg";
  document.getElementById(buttonId).onclick = function() {
    showBlogPost(postNum);
  };  

  // Remove blog post content from its area.
  const blogPostId = "blogPostArea" + postNum;
  document.getElementById(blogPostId).innerHTML = "";
}
