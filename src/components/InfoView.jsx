const Section = ({ title, children }) => (
  <div className="bg-[#1A1A22] border border-[#272732] rounded-lg p-6 space-y-4">
    <h2 className="text-lg font-semibold text-[#A78BFA]">{title}</h2>
    {children}
  </div>
);

const Table = ({ headers, rows, colStyles = [] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-[#272732]">
          {headers.map((h, i) => (
            <th
              key={i}
              className={`text-left py-2 px-3 text-[#9CA3AF] font-medium ${colStyles[i] || ''}`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className="border-b border-[#272732]/50 hover:bg-[#252530]/40 transition-colors">
            {row.map((cell, ci) => (
              <td key={ci} className={`py-2 px-3 ${colStyles[ci] || ''}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Badge = ({ color, children }) => {
  const colors = {
    green: 'bg-green-500/10 text-green-300 border-green-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    red: 'bg-red-500/10 text-red-300 border-red-500/30',
    blue: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    gray: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
};

const InfoView = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Battery Info</h1>
        <p className="text-[#9CA3AF] mt-1 text-sm">
          REV Slim NiMH 12V 3Ah — operating ranges and tester configuration
        </p>
      </div>

      <Section title="Tester Configuration — CTRE Battery Beak (am-0995)">
        <Table
          headers={['Setting', 'Value']}
          colStyles={['w-48 text-[#9CA3AF]', '']}
          rows={[
            ['Chemistry', 'NiMH'],
            ['Nominal Voltage', '12V'],
            ['Capacity', '3Ah'],
            [
              'Status Labels',
              <span key="note" className="text-yellow-300 text-xs">
                Ignore Beak's Good / Fair / Bad — calibrated for Tetrix, not REV Slim. Use the raw Ω reading.
              </span>,
            ],
          ]}
        />
      </Section>

      <Section title="Internal Resistance Ranges">
        <Table
          headers={['Range (Ω)', 'Condition', 'Competition Status']}
          rows={[
            [
              '< 0.100 Ω',
              'Excellent',
              <Badge key="a" color="green">Match Ready</Badge>,
            ],
            [
              '0.100 – 0.170 Ω',
              'Good',
              <Badge key="b" color="green">Match Ready</Badge>,
            ],
            [
              '0.170 – 0.200 Ω',
              'Caution',
              <span key="c" className="flex items-center gap-2 flex-wrap">
                <Badge color="yellow">Caution</Badge>
                <span className="text-[#9CA3AF] text-xs">Charge before next match; use only if no better option</span>
              </span>,
            ],
            [
              '> 0.200 Ω',
              'Bad',
              <span key="d" className="flex items-center gap-2 flex-wrap">
                <Badge color="red">Reject from Competition</Badge>
                <span className="text-[#9CA3AF] text-xs">Practice only or retire from service</span>
              </span>,
            ],
          ]}
        />
        <p className="text-xs text-[#9CA3AF]">
          A new REV Slim in excellent condition reads below 0.100 Ω. Readings rise with age and cycle count.
        </p>
      </Section>

      <Section title="Voltage Ranges">
        <Table
          headers={['Condition', 'Voltage', 'Action']}
          colStyles={['w-64 text-[#9CA3AF]', 'w-36 font-mono', '']}
          rows={[
            [
              'Fully charged (no load / at rest)',
              '12.0 – 12.8V',
              <Badge key="a" color="green">Ready</Badge>,
            ],
            [
              'Low resting voltage — queue for charge',
              '< 11.5V',
              <Badge key="b" color="yellow">Send to charger</Badge>,
            ],
            [
              'Low state of charge — queue for charge',
              '< 80% SOC',
              <Badge key="c" color="yellow">Send to charger</Badge>,
            ],
            [
              'Minimum no-load voltage (REV spec)',
              '9.0V',
              <span key="d" className="text-[#9CA3AF] text-xs">Hard lower limit at rest</span>,
            ],
            [
              'Sustained ≤ 9.0V under heavy load',
              '≤ 9.0V',
              <Badge key="e" color="red">Permanent cell damage</Badge>,
            ],
          ]}
        />
        <p className="text-xs text-[#9CA3AF]">
          Brief dips below 9.0V under heavy load are expected and acceptable.
          Consistently operating at or below this threshold permanently damages the cells and shortens battery lifespan.
        </p>
      </Section>

      <Section title="Health Score Mapping">
        <Table
          headers={['Health Score', 'Classification', 'Meaning']}
          rows={[
            [
              '85 – 100',
              <Badge key="a" color="green">Match Ready</Badge>,
              'Safe for competition use',
            ],
            [
              '65 – 84',
              <Badge key="b" color="yellow">Practice</Badge>,
              'Caution zone — avoid competition unless necessary',
            ],
            [
              '0 – 64',
              <Badge key="c" color="red">Do Not Use</Badge>,
              'Reject from competition; practice only or retire',
            ],
          ]}
        />
        <p className="text-xs text-[#9CA3AF]">
          Health score is weighted: 70% internal resistance, 20% state of charge, 10% derived status.
        </p>
      </Section>
    </div>
  );
};

export default InfoView;
