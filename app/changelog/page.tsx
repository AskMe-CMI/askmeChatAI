"use client"

import { useEffect, useState } from 'react';

const CHANGELOG_API = "/api/changelog"; // สร้าง API endpoint นี้ใน backend

export default function ChangeLogPage() {
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // setLoading(false);
    fetch(CHANGELOG_API)
      .then((res) => res.text())
      .then((data) => {
        setContent(data);
        setNewContent(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    await fetch(CHANGELOG_API, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: newContent,
    });
    setContent(newContent);
    setEditing(false);
    setLoading(false);
  };

  if (loading) 
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        fontSize: 20,
        color: "#888"
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16 }}>
          <circle cx="12" cy="12" r="10" stroke="#888" strokeWidth="4" opacity="0.2"/>
          <path d="M12 2a10 10 0 1 1-7.07 2.93" stroke="#888" strokeWidth="4" strokeLinecap="round">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 12 12"
              to="360 12 12"
              dur="1s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
        Loading...
      </div>
    );

  return (
    <div>
      <button
        type="button"
        onClick={() => window.history.back()}
        style={{
          margin: "24px 0 0 24px",
          padding: "8px 16px",
          borderRadius: 6,
          // border: "1px solid #ccc",
          // background: "#f5f5f5",
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        ← Back
      </button>
      <div style={{ maxWidth: 800, margin: "auto", padding: 24 }}>
        <div>
          {/* <h1>CHANGELOG.md</h1> */}
          <pre
            style={{
              // background: "#f5f5f5",
              padding: 16,
              borderRadius: 8,
              whiteSpace: "pre-wrap",
            }}
          >
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
}