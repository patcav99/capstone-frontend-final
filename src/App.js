
import React, { useState } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [items, setItems] = useState([]);

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
    </div>
  );
}

export default App;
