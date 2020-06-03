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
  const facts = [
    'I love hot cheetos.',
    'Purple is my favorite color.',
    'I\'m horrible at remembering song lyrics.',
    'I speak some French.',
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
  if (button !== null) {
    button.src = '/images/downtriangle.jpeg';
    button.onclick = function() {
      hideBlogPost(postNum);
    };
  }

  // Show blog post content in the correct area.
  const blogPostId = 'blogPost' + postNum;
  const postArea = document.getElementById(blogPostId);
  if (postArea !== null) {
    postArea.style.display = 'block';
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

  // Hide blog post content from its area.
  const blogPostId = 'blogPost' + postNum;
  const postArea = document.getElementById(blogPostId);
  if (postArea !== null) {
    postArea.style.display = 'none';
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
  if (commentArea !== null && comments !== null) {
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      const paragraphTag = document.createElement('p');
      paragraphTag.appendChild(document.createTextNode(comment));
      commentArea.appendChild(paragraphTag);
    }
  }
}
