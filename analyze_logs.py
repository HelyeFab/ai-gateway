#!/usr/bin/env python3
"""
AI Gateway Audit Log Analyzer

This tool analyzes audit logs from the AI Gateway to provide insights into:
- Request patterns and usage statistics
- Security events and unauthorized access attempts
- User and service activity analysis
- IP address patterns and potential threats
"""

import argparse
import json
import re
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Optional, Tuple
import sys

class AuditLogAnalyzer:
    """Analyzes AI Gateway audit logs for security and usage insights."""

    def __init__(self, log_file: str):
        self.log_file = Path(log_file)
        self.log_pattern = re.compile(
            r'(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \| '
            r'(?P<level>\w+) \| '
            r'(?P<event>\w+) \| '
            r'(?P<method>\w+) '
            r'(?P<endpoint>/[^\|]*) \|'
            r'(?P<details>.*)'
        )

    def parse_logs(self, hours_back: Optional[int] = None) -> List[Dict]:
        """Parse audit logs and return structured data."""
        if not self.log_file.exists():
            print(f"❌ Log file not found: {self.log_file}")
            return []

        cutoff_time = None
        if hours_back:
            cutoff_time = datetime.now() - timedelta(hours=hours_back)

        logs = []
        try:
            with open(self.log_file, 'r') as f:
                for line_num, line in enumerate(f, 1):
                    try:
                        match = self.log_pattern.match(line.strip())
                        if not match:
                            continue

                        timestamp_str = match.group('timestamp')
                        timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')

                        # Skip entries older than cutoff
                        if cutoff_time and timestamp < cutoff_time:
                            continue

                        log_entry = {
                            'timestamp': timestamp,
                            'level': match.group('level'),
                            'event': match.group('event'),
                            'method': match.group('method'),
                            'endpoint': match.group('endpoint'),
                            'details': match.group('details').strip(),
                            'line_num': line_num
                        }

                        # Parse additional details
                        details = log_entry['details']

                        # Extract IP address
                        ip_match = re.search(r'IP: ([\d\.]+|unknown)', details)
                        log_entry['ip'] = ip_match.group(1) if ip_match else 'unknown'

                        # Extract user and service for authorized requests
                        if log_entry['event'] == 'AUTHORIZED':
                            user_match = re.search(r'User: ([^\|]+)', details)
                            service_match = re.search(r'Service: ([^\|]+)', details)
                            log_entry['user'] = user_match.group(1).strip() if user_match else 'unknown'
                            log_entry['service'] = service_match.group(1).strip() if service_match else 'unknown'

                        # Extract partial key for unauthorized requests
                        elif log_entry['event'] == 'UNAUTHORIZED':
                            key_match = re.search(r'Key: ([^\|]+)', details)
                            log_entry['key_partial'] = key_match.group(1).strip() if key_match else 'missing'

                        logs.append(log_entry)

                    except Exception as e:
                        print(f"⚠️  Warning: Failed to parse line {line_num}: {e}")
                        continue

        except Exception as e:
            print(f"❌ Error reading log file: {e}")
            return []

        return logs

    def generate_summary(self, logs: List[Dict]) -> Dict:
        """Generate summary statistics from logs."""
        if not logs:
            return {}

        summary = {
            'total_requests': len(logs),
            'time_range': {
                'start': min(log['timestamp'] for log in logs).isoformat(),
                'end': max(log['timestamp'] for log in logs).isoformat()
            },
            'events': Counter(log['event'] for log in logs),
            'methods': Counter(log['method'] for log in logs),
            'endpoints': Counter(log['endpoint'] for log in logs),
            'unique_ips': len(set(log['ip'] for log in logs)),
            'top_ips': Counter(log['ip'] for log in logs).most_common(10)
        }

        # Authorized request analysis
        authorized_logs = [log for log in logs if log['event'] == 'AUTHORIZED']
        if authorized_logs:
            summary['authorized'] = {
                'count': len(authorized_logs),
                'users': Counter(log.get('user', 'unknown') for log in authorized_logs).most_common(10),
                'services': Counter(log.get('service', 'unknown') for log in authorized_logs).most_common(10),
                'endpoints': Counter(log['endpoint'] for log in authorized_logs).most_common(10)
            }

        # Unauthorized request analysis
        unauthorized_logs = [log for log in logs if log['event'] == 'UNAUTHORIZED']
        if unauthorized_logs:
            summary['unauthorized'] = {
                'count': len(unauthorized_logs),
                'ips': Counter(log['ip'] for log in unauthorized_logs).most_common(10),
                'endpoints': Counter(log['endpoint'] for log in unauthorized_logs).most_common(10),
                'methods': Counter(log['method'] for log in unauthorized_logs).most_common(5)
            }

        return summary

    def detect_suspicious_activity(self, logs: List[Dict]) -> List[Dict]:
        """Detect suspicious patterns in the logs."""
        suspicious = []

        # Group by IP address
        ip_activity = defaultdict(list)
        for log in logs:
            ip_activity[log['ip']].append(log)

        for ip, ip_logs in ip_activity.items():
            if ip == 'unknown':
                continue

            # Multiple failed attempts
            unauthorized_count = sum(1 for log in ip_logs if log['event'] == 'UNAUTHORIZED')
            if unauthorized_count >= 5:
                suspicious.append({
                    'type': 'Multiple Unauthorized Attempts',
                    'ip': ip,
                    'count': unauthorized_count,
                    'timespan': f"{min(log['timestamp'] for log in ip_logs)} to {max(log['timestamp'] for log in ip_logs)}",
                    'severity': 'HIGH' if unauthorized_count >= 10 else 'MEDIUM'
                })

            # High request volume from single IP
            if len(ip_logs) >= 100:
                suspicious.append({
                    'type': 'High Request Volume',
                    'ip': ip,
                    'count': len(ip_logs),
                    'timespan': f"{min(log['timestamp'] for log in ip_logs)} to {max(log['timestamp'] for log in ip_logs)}",
                    'severity': 'MEDIUM'
                })

        # Sort by severity
        severity_order = {'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}
        suspicious.sort(key=lambda x: severity_order.get(x['severity'], 0), reverse=True)

        return suspicious

    def user_activity_report(self, logs: List[Dict]) -> Dict:
        """Generate detailed user activity report."""
        authorized_logs = [log for log in logs if log['event'] == 'AUTHORIZED' and log.get('user')]

        if not authorized_logs:
            return {}

        user_activity = defaultdict(lambda: {
            'total_requests': 0,
            'services': Counter(),
            'endpoints': Counter(),
            'ips': set(),
            'first_seen': None,
            'last_seen': None
        })

        for log in authorized_logs:
            user = log.get('user', 'unknown')
            activity = user_activity[user]

            activity['total_requests'] += 1
            activity['services'][log.get('service', 'unknown')] += 1
            activity['endpoints'][log['endpoint']] += 1
            activity['ips'].add(log['ip'])

            if not activity['first_seen'] or log['timestamp'] < activity['first_seen']:
                activity['first_seen'] = log['timestamp']
            if not activity['last_seen'] or log['timestamp'] > activity['last_seen']:
                activity['last_seen'] = log['timestamp']

        # Convert sets to lists and timestamps to strings for JSON serialization
        for user, activity in user_activity.items():
            activity['ips'] = list(activity['ips'])
            activity['unique_ip_count'] = len(activity['ips'])
            activity['first_seen'] = activity['first_seen'].isoformat() if activity['first_seen'] else None
            activity['last_seen'] = activity['last_seen'].isoformat() if activity['last_seen'] else None
            activity['services'] = dict(activity['services'])
            activity['endpoints'] = dict(activity['endpoints'])

        return dict(user_activity)

def print_summary(summary: Dict):
    """Print formatted summary report."""
    print("📊 AI Gateway Audit Log Summary")
    print("=" * 50)

    print(f"📈 Total Requests: {summary.get('total_requests', 0)}")

    time_range = summary.get('time_range', {})
    if time_range:
        print(f"⏰ Time Range: {time_range.get('start', 'unknown')} to {time_range.get('end', 'unknown')}")

    print(f"🌐 Unique IP Addresses: {summary.get('unique_ips', 0)}")

    # Event breakdown
    events = summary.get('events', {})
    if events:
        print(f"\n🎯 Request Types:")
        for event, count in events.items():
            print(f"  {event}: {count}")

    # Top endpoints
    endpoints = summary.get('endpoints', {})
    if endpoints:
        print(f"\n🔗 Top Endpoints:")
        for endpoint, count in list(endpoints.items())[:5]:
            print(f"  {endpoint}: {count}")

    # Authorized activity
    authorized = summary.get('authorized', {})
    if authorized:
        print(f"\n✅ Authorized Requests: {authorized.get('count', 0)}")
        users = authorized.get('users', [])
        if users:
            print(f"👥 Top Users:")
            for user, count in users[:5]:
                print(f"  {user}: {count}")

    # Unauthorized activity
    unauthorized = summary.get('unauthorized', {})
    if unauthorized:
        print(f"\n❌ Unauthorized Requests: {unauthorized.get('count', 0)}")
        ips = unauthorized.get('ips', [])
        if ips:
            print(f"🚨 Top Unauthorized IPs:")
            for ip, count in ips[:5]:
                print(f"  {ip}: {count}")

def print_suspicious_activity(suspicious: List[Dict]):
    """Print suspicious activity report."""
    if not suspicious:
        print("✅ No suspicious activity detected")
        return

    print(f"\n🚨 Suspicious Activity Detected ({len(suspicious)} alerts)")
    print("=" * 50)

    for alert in suspicious:
        severity_emoji = "🔴" if alert['severity'] == 'HIGH' else "🟡"
        print(f"{severity_emoji} {alert['severity']} - {alert['type']}")
        print(f"   IP: {alert['ip']}")
        print(f"   Count: {alert['count']}")
        print(f"   Timespan: {alert['timespan']}")
        print()

def main():
    """Main CLI interface."""
    parser = argparse.ArgumentParser(
        description="AI Gateway Audit Log Analyzer",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --log-file ./logs/audit.log                    # Analyze all logs
  %(prog)s --log-file ./logs/audit.log --hours 24        # Last 24 hours
  %(prog)s --log-file ./logs/audit.log --suspicious      # Show only suspicious activity
  %(prog)s --log-file ./logs/audit.log --users           # User activity report
  %(prog)s --log-file ./logs/audit.log --json            # Output as JSON
        """
    )

    parser.add_argument("--log-file", required=True, help="Path to audit log file")
    parser.add_argument("--hours", type=int, help="Analyze only last N hours")
    parser.add_argument("--suspicious", action="store_true", help="Show only suspicious activity")
    parser.add_argument("--users", action="store_true", help="Show detailed user activity")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    parser.add_argument("--output", help="Save results to file")

    args = parser.parse_args()

    analyzer = AuditLogAnalyzer(args.log_file)
    logs = analyzer.parse_logs(hours_back=args.hours)

    if not logs:
        print("❌ No logs found or failed to parse logs")
        sys.exit(1)

    results = {}

    if args.suspicious:
        suspicious = analyzer.detect_suspicious_activity(logs)
        results['suspicious_activity'] = suspicious
        if not args.json:
            print_suspicious_activity(suspicious)
    elif args.users:
        user_activity = analyzer.user_activity_report(logs)
        results['user_activity'] = user_activity
        if not args.json:
            print("👥 User Activity Report")
            print("=" * 30)
            for user, activity in user_activity.items():
                print(f"\n🔑 User: {user}")
                print(f"   Total Requests: {activity['total_requests']}")
                print(f"   Unique IPs: {activity['unique_ip_count']}")
                print(f"   Services: {', '.join(activity['services'].keys())}")
                print(f"   First Seen: {activity['first_seen']}")
                print(f"   Last Seen: {activity['last_seen']}")
    else:
        summary = analyzer.generate_summary(logs)
        suspicious = analyzer.detect_suspicious_activity(logs)
        results = {
            'summary': summary,
            'suspicious_activity': suspicious
        }
        if not args.json:
            print_summary(summary)
            print_suspicious_activity(suspicious)

    if args.json:
        print(json.dumps(results, indent=2, default=str))

    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        print(f"\n💾 Results saved to {args.output}")

if __name__ == "__main__":
    main()
