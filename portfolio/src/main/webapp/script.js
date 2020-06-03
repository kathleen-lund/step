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
 * Gets the requested number of comments using the GetCommentsServlet
 * and adds them to the site interface.
 */
async function getComments() {
  let numComments = getNumComments();
  if (numComments === -1) {
    // If number was unable to be parsed, default to 5
    numComments = 5;
  }

  // Fetch correct number of comments from servlet
  const responsePath = '/get-comments?num=' + String(numComments);
  const response = await fetch(responsePath);
  const comments = await response.json();

  const commentArea = document.getElementById('comment-space');
  if (commentArea !== null && comments !== null) {
    // Clear comment area in case page is being reloaded
    commentArea.innerHTML = '';
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      const commentElement = createCommentElement(comment);
      commentArea.appendChild(commentElement);
    }
  }
}

/**
 * Retrieve the number of comments to display from the
 * drop-down menu.
 * @return {number} the number of comments requested,
 * or -1 if it could not be found.
 */
function getNumComments() {
  // Get the selected number from the dropdown
  const num = document.getElementById('numComments');
  if (num !== null) {
    let numComments = num.options[num.selectedIndex].text;

    // Parse String to int to return
    numComments = parseInt(numComments);
    if (!isNaN(numComments)) {
      return numComments;
    }
    return -1;
  }
  return -1;
}

/**
 * Delete a comment using its id and the
 * DeleteCommentServlet.
 */
async function deleteComment(comment) {
  const params = new URLSearchParams();
  params.append('id', comment.id);
  fetch('/delete-comment', {method: 'POST', body: params});
}

/**
 * Creates an element for a comment, including its delete button.
 */
function createCommentElement(comment) {
  // Article tag to encapsulate comment elements
  const commentElement = document.createElement('article');
  commentElement.className = 'comment';

  // Bold tag for the username
  const username = document.createElement('b');
  const usernameStr = comment.username + ":";
  username.innerText = usernameStr;

  // Span tag for the comment text
  const text = document.createElement('span');
  text.innerText = comment.text;

  // Delete button for each comment
  const deleteButton = document.createElement('button');
  deleteButton.innerText = 'Delete';
  deleteButton.className = 'buttonSmall';
  deleteButton.addEventListener('click', () => {
    // Delete function to remove this comment from Datastore
    deleteComment(comment);

    // Remove the comment from the DOM
    commentElement.remove();
  });

  // Append username, text, and delete button to overall element
  commentElement.appendChild(username);
  commentElement.appendChild(text);
  commentElement.appendChild(deleteButton);
  return commentElement;
}
