import React from 'react';
import { Calculator } from './Calculator';
import { Card } from './UI/Card';

export const CalculatorDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Calculator UI Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A modern, responsive calculator with a clean number pad and display. 
            Built with React and styled to match the Land Visualizer design system.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Calculator */}
          <div className="flex justify-center">
            <Calculator />
          </div>

          {/* Features */}
          <Card padding="lg" shadow="medium">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Features
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-medium text-gray-900">Basic Operations</h3>
                  <p className="text-sm text-gray-600">
                    Addition, subtraction, multiplication, division, and modulo
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-medium text-gray-900">Advanced Functions</h3>
                  <p className="text-sm text-gray-600">
                    Square (x²), square root (√), plus/minus (±), and decimal support
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-medium text-gray-900">Smart Display</h3>
                  <p className="text-sm text-gray-600">
                    Shows previous operation, handles large numbers, and error states
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-medium text-gray-900">Keyboard Support</h3>
                  <p className="text-sm text-gray-600">
                    Backspace, clear, and intuitive button interactions
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-medium text-gray-900">Responsive Design</h3>
                  <p className="text-sm text-gray-600">
                    Clean, modern interface that works on all screen sizes
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Usage Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click numbers to input values</li>
                <li>• Use operation buttons for calculations</li>
                <li>• Press '=' to get the result</li>
                <li>• Use 'C' to clear everything</li>
                <li>• Use '⌫' to backspace</li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Code Example */}
        <Card className="mt-8" padding="lg" shadow="medium">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Integration Example
          </h2>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-sm">
              <code>{`import { Calculator } from './components/Calculator';

function App() {
  return (
    <div className="app">
      <Calculator />
    </div>
  );
}`}</code>
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
};

