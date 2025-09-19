
import React, { useState } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [items, setItems] = useState([]);

  // Function to send items to backend
  const sendItemsToBackend = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/add-items/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });
      const data = await response.json();
      alert("Items sent! Response: " + JSON.stringify(data));
    } catch (error) {
      alert("Error sending items: " + error);
    }
  };

  const handleAdd = () => {
    if (input.trim() !== "") {
      setItems([...items, input]);
      setInput("");
    }
  };

  return (
    <div className="App" style={{ marginTop: 40 }}>
      <h2>Add Items to the List</h2>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Enter item"
        style={{ marginRight: 8 }}
      />
      <button onClick={handleAdd}>Add</button>
      <ul style={{ marginTop: 20 }}>
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
      <button onClick={sendItemsToBackend} style={{ marginTop: 16 }}>Send List to Backend</button>
    </div>
  );
}

export default App;
