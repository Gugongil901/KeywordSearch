import React from 'react';

const TestComponent: React.FC = () => {
  return (
    <div className="p-4 m-4 bg-blue-100 rounded-md">
      <h2 className="text-xl font-bold">테스트 컴포넌트</h2>
      <p>이 컴포넌트가 보이면 React가 제대로 작동하는 것입니다.</p>
    </div>
  );
};

export default TestComponent;