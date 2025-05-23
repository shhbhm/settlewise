import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  Position,
  MarkerType,
  EdgeTypes,
  SmoothStepEdge,
  EdgeProps,
  getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

interface Person {
  id: string;
  name: string;
  balance: number;
}

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
}

// Binary Heap implementation from original repo
class BinaryHeap {
  private heap: [number, number][];

  constructor() {
    this.heap = [];
  }

  insert(value: [number, number]) {
    this.heap.push(value);
    this.bubbleUp(this.heap.length - 1);
  }

  extractMax(): [number, number] {
    if (this.heap.length === 0) {
      throw new Error("Heap is empty");
    }

    const max = this.heap[0];
    const last = this.heap.pop()!;

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }

    return max;
  }

  empty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(index: number) {
    const element = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex][0] >= element[0]) break;
      this.heap[index] = this.heap[parentIndex];
      index = parentIndex;
    }
    this.heap[index] = element;
  }

  private bubbleDown(index: number) {
    const element = this.heap[index];
    const length = this.heap.length;

    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let leftChild: [number, number] | undefined;
      let rightChild: [number, number] | undefined;
      let swap: number | null = null;

      if (leftChildIndex < length) {
        leftChild = this.heap[leftChildIndex];
        if (leftChild[0] > element[0]) {
          swap = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        rightChild = this.heap[rightChildIndex];
        if (
          (swap === null && rightChild[0] > element[0]) ||
          (swap !== null && rightChild[0] > leftChild![0])
        ) {
          swap = rightChildIndex;
        }
      }

      if (swap === null) break;

      this.heap[index] = this.heap[swap];
      index = swap;
    }

    this.heap[index] = element;
  }
}

// Custom edge label component
const CustomEdgeLabel = ({ label }: { label: string }) => (
  <div
    style={{
      background: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      border: '1px solid #2D3748',
      fontSize: '12px',
      fontWeight: 'bold',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}
  >
    ₹{label}
  </div>
);

// Custom edge component
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <foreignObject
        width={100}
        height={40}
        x={labelX - 50}
        y={labelY - 20}
        className="edge-label-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <CustomEdgeLabel label={label?.toString() || ''} />
      </foreignObject>
    </>
  );
};

// Custom edge types
const edgeTypes: EdgeTypes = {
  default: CustomEdge,
};

// Default edge style
const defaultEdgeStyle = {
  stroke: '#2D3748',
  strokeWidth: 2,
};

// Default marker style
const defaultMarkerStyle = {
  type: MarkerType.ArrowClosed as const,
  width: 20,
  height: 20,
  color: '#2D3748',
};

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSolved, setIsSolved] = useState(false);

  const generateRandomProblem = useCallback(() => {
    setIsLoading(true);
    
    // Generate random number of people (2-9)
    const numPeople = Math.floor(Math.random() * 8) + 2;
    const newPeople: Person[] = [];
    const newTransactions: Transaction[] = [];
    
    // Create people
    for (let i = 0; i < numPeople; i++) {
      newPeople.push({
        id: `person-${i}`,
        name: `Person ${i + 1}`,
        balance: 0,
      });
    }
    
    // Generate random transactions (exactly like original repo)
    for (let i = 0; i < numPeople; i++) {
      for (let j = i + 1; j < numPeople; j++) {
        if (Math.random() > 0.5) {
          const amount = Math.floor(Math.random() * 100) + 1;
          if (Math.random() > 0.5) {
            newTransactions.push({
              id: `trans-${i}-${j}`,
              from: `person-${i}`,
              to: `person-${j}`,
              amount,
            });
          } else {
            newTransactions.push({
              id: `trans-${j}-${i}`,
              from: `person-${j}`,
              to: `person-${i}`,
              amount,
            });
          }
        }
      }
    }

    // Calculate balances
    const updatedPeople = newPeople.map(person => {
      const balance = newTransactions.reduce((acc, trans) => {
        if (trans.from === person.id) return acc - trans.amount;
        if (trans.to === person.id) return acc + trans.amount;
        return acc;
      }, 0);
      return { ...person, balance };
    });

    // Create nodes for the graph
    const newNodes: Node[] = updatedPeople.map((person, index) => ({
      id: person.id,
      data: { 
        label: `${person.name}\n(${person.balance > 0 ? '+' : ''}${person.balance})`,
      },
      position: {
        x: 250 + Math.cos(index * (2 * Math.PI / numPeople)) * 200,
        y: 250 + Math.sin(index * (2 * Math.PI / numPeople)) * 200,
      },
      style: {
        background: person.balance > 0 ? '#48BB78' : person.balance < 0 ? '#F56565' : '#A0AEC0',
        color: 'white',
        padding: 10,
        borderRadius: 5,
        width: 100,
        textAlign: 'center',
      },
    }));

    // Create edges for the graph with arrow style
    const newEdges: Edge[] = newTransactions.map(trans => ({
      id: trans.id,
      source: trans.from,
      target: trans.to,
      label: trans.amount.toString(),
      type: 'default',
      animated: true,
      style: defaultEdgeStyle,
      markerEnd: defaultMarkerStyle,
    }));

    setPeople(updatedPeople);
    setTransactions(newTransactions);
    setNodes(newNodes);
    setEdges(newEdges);
    setIsSolved(false);
    setIsLoading(false);
  }, []);

  const handleSolveProblem = useCallback(() => {
    setIsLoading(true);
    
    // Create arrays for balances (exactly like original repo)
    const vals = Array(people.length).fill(0);
    
    // Calculate net balance of each person
    transactions.forEach(trans => {
      vals[parseInt(trans.to.split('-')[1])] += trans.amount;
      vals[parseInt(trans.from.split('-')[1])] -= trans.amount;
    });

    // Create heaps for positive and negative balances
    const posHeap = new BinaryHeap();
    const negHeap = new BinaryHeap();

    // Add people to appropriate heaps
    vals.forEach((val, i) => {
      if (val > 0) {
        posHeap.insert([val, i]);
      } else if (val < 0) {
        negHeap.insert([-val, i]);
      }
    });

    const newTransactions: Transaction[] = [];

    // Match positive and negative balances using heaps
    while (!posHeap.empty() && !negHeap.empty()) {
      const [posAmount, posIndex] = posHeap.extractMax();
      const [negAmount, negIndex] = negHeap.extractMax();

      const amount = Math.min(posAmount, negAmount);
      const from = `person-${negIndex}`;
      const to = `person-${posIndex}`;

      newTransactions.push({
        id: `solved-${from}-${to}`,
        from,
        to,
        amount,
      });

      // Add remaining amounts back to heaps
      if (posAmount > negAmount) {
        posHeap.insert([posAmount - negAmount, posIndex]);
      } else if (negAmount > posAmount) {
        negHeap.insert([negAmount - posAmount, negIndex]);
      }
    }

    // Create new edges for the solved transactions with arrow style
    const newEdges: Edge[] = newTransactions.map(trans => ({
      id: trans.id,
      source: trans.from,
      target: trans.to,
      label: trans.amount.toString(),
      type: 'default',
      animated: true,
      style: defaultEdgeStyle,
      markerEnd: defaultMarkerStyle,
    }));

    // Update nodes to show final balances (all should be 0)
    const newNodes: Node[] = people.map((person, index) => ({
      id: person.id,
      data: { 
        label: `${person.name}\n(0)`,
      },
      position: {
        x: 250 + Math.cos(index * (2 * Math.PI / people.length)) * 200,
        y: 250 + Math.sin(index * (2 * Math.PI / people.length)) * 200,
      },
      style: {
        background: '#A0AEC0', // All nodes are gray (zero balance)
        color: 'white',
        padding: 10,
        borderRadius: 5,
        width: 100,
        textAlign: 'center',
      },
    }));

    setTransactions(newTransactions);
    setNodes(newNodes);
    setEdges(newEdges);
    setIsSolved(true);
    setIsLoading(false);
  }, [people, transactions]);

  const handleClear = () => {
    setNodes([]);
    setEdges([]);
    setPeople([]);
    setTransactions([]);
    setIsSolved(false);
  };

  const renderSolutionSummary = () => {
    if (!isSolved) return null;

    // Calculate original balances
    const originalBalances = people.map(person => {
      const balance = transactions.reduce((acc, trans) => {
        if (trans.from === person.id) return acc - trans.amount;
        if (trans.to === person.id) return acc + trans.amount;
        return acc;
      }, 0);
      return { ...person, balance };
    });

    // Calculate final balances (should all be 0)
    const finalBalances = people.map(person => {
      const balance = transactions.reduce((acc, trans) => {
        if (trans.from === person.id) return acc - trans.amount;
        if (trans.to === person.id) return acc + trans.amount;
        return acc;
      }, 0);
      return { ...person, balance };
    });

    return (
      <div className="solution-summary">
        <h3>Transaction Summary</h3>
        <div className="summary-tables">
          <div className="summary-table">
            <h4>Original Transactions</h4>
            <table>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {originalBalances.map(person => (
                  <tr key={person.id}>
                    <td>{person.name}</td>
                    <td className={person.balance > 0 ? 'positive' : person.balance < 0 ? 'negative' : 'neutral'}>
                      {person.balance > 0 ? '+' : ''}{person.balance}
                    </td>
                    <td>
                      {person.balance > 0 ? 'Creditor' : person.balance < 0 ? 'Debtor' : 'Settled'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="summary-table">
            <h4>Optimized Transactions</h4>
            <table>
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(trans => (
                  <tr key={trans.id}>
                    <td>{people.find(p => p.id === trans.from)?.name}</td>
                    <td>{people.find(p => p.id === trans.to)?.name}</td>
                    <td className="amount">₹{trans.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Original Transactions:</span>
            <span className="stat-value">{transactions.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Optimized Transactions:</span>
            <span className="stat-value">{edges.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Reduction:</span>
            <span className="stat-value">{Math.round((1 - edges.length / transactions.length) * 100)}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>SettleWise</h1>
        <p className="subtitle">Smart Expense Settlement</p>
        <p className="copyright">© 2025 Shubham Solanki. All rights reserved.</p>
      </header>

      <main className="main-content">
        <div className="graph-container">
          {nodes.length > 0 ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              edgeTypes={edgeTypes}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
          ) : (
            <div className="placeholder-graph">
              Click "Generate Problem" to create a new expense settlement scenario
            </div>
          )}
        </div>

        <div className="button-container">
          <button 
            className="action-button generate"
            onClick={generateRandomProblem}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Problem'}
          </button>
          
          <button 
            className="action-button solve"
            onClick={handleSolveProblem}
            disabled={isLoading || nodes.length === 0 || isSolved}
          >
            {isLoading ? 'Solving...' : 'Solve Problem'}
          </button>
          
          <button 
            className="action-button clear"
            onClick={handleClear}
            disabled={isLoading || nodes.length === 0}
          >
            Clear
          </button>
        </div>

        {renderSolutionSummary()}
      </main>
    </div>
  );
}

export default App;
