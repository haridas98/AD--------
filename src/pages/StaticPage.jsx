import React from 'react';
export default function StaticPage({ title, body }) {
  return (
    <main className="container page-pad static-page reveal">
      <h1>{title}</h1>
      <p>{body}</p>
    </main>
  );
}
