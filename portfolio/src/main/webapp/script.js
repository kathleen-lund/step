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

/* Load blog post data once the rest of the page has loaded. */
let posts = [];
document.addEventListener('DOMContentLoaded', function() {
  const p1 = document.createElement('p');
  p1.appendChild(document.createTextNode(
      'I have a secret love for ' +
      'bucket balls. Not only am I randomly good at tossing balls in ' +
      'incrementally spaced buckets, but I\'ve had lots of opportunity to ' +
      'do so. Some of my fondest memories are tossing softballs back ' +
      'into the ball bucket from many yards away at the end of practice, ' +
      'to the delight of my teammates.'));
  const img1 = document.createElement('img');
  img1.src = '/images/bucketballs.png';
  const post1 = [p1, img1];

  const p2 = document.createElement('p');
  p2.appendChild(document.createTextNode(
      'My fingers are very ' +
      'double-jointed. I can bend them all downward at the first joint ' +
      'behind the nail, and my thumbs bend backwards in a hitchhiker\'s ' +
      'thumb position. This double-jointedness actually makes it a bit ' +
      'difficult to play the cello, as collapsing joints are a big no-no ' +
      'for your left hand.'));
  const post2 = [p2];
  posts = [post1, post2];
});

/**
 * Adds a random fact to the page.
 */
function addRandomFact() {
  const facts = [
    'I love hot cheetos.', 'Purple is my favorite color.',
    'I\'m horrible at remembering song lyrics.', 'I speak some French.',
  ];

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
  const buttonId = 'expandTriangle' + postNum;
  const button = document.getElementById(buttonId);
  console.log(button);
  if (button !== null) {
    button.src = '/images/downtriangle.jpeg';
    button.onclick = function() {
      hideBlogPost(postNum);
    };
  }

  // Add blog post content to the correct area.
  const blogPostId = 'blogPostArea' + postNum;
  const postArea = document.getElementById(blogPostId);
  if (postArea !== null) {
    if (postNum > 0 && postNum <= posts.length) {
      const elements = posts[postNum - 1];
      let i = 0;
      for (i; i < elements.length; i++) {
        const element = elements[i];
        if (element !== null) {
          postArea.appendChild(element);
        }
      }
    }
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
  const buttonId = 'expandTriangle' + postNum;
  const button = document.getElementById(buttonId);
  if (button !== null) {
    button.src = '/images/righttriangle.jpeg';
    button.onclick = function() {
      showBlogPost(postNum);
    };
  }

  // Remove blog post content from its area.
  const blogPostId = 'blogPostArea' + postNum;
  const postArea = document.getElementById(blogPostId);
  if (postArea !== null) {
    if (postNum > 0 && postNum <= posts.length) {
      const elements = posts[postNum - 1];
      let i = 0;
      for (i; i < elements.length; i++) {
        const element = elements[i];
        if (element !== null) {
          postArea.removeChild(element);
        }
      }
    }
  }
}

/**
 * Another way to use fetch is by using the async and await keywords. This
 * allows you to use the return values directly instead of going through
 * Promises.
 */
async function getCommentsUsingAsyncAwait() {
  const response = await fetch('/data');
  const comments = await response.json();

  const commentArea = document.getElementById('comment-space');
  if (commentArea !== null) {
    if (comments !== null) {
      let i = 0;
      for (i; i < comments.length; i++) {
        const comment = comments[i];
        const paragraphTag = document.createElement('p');
        paragraphTag.appendChild(document.createTextNode(comment));
        if (paragraphTag !== null) {
          commentArea.appendChild(paragraphTag);
        }
      }
    }
  }
}
