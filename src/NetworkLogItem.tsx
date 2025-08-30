import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NetworkLog, NetworkRequestHeaders } from './types';
import { CopyItem } from './CopyItem';
import Icon from './Icon';

interface NetworkLogItemProps {
  log: NetworkLog;
}

const NetworkLogItem: React.FC<NetworkLogItemProps> = ({ log }) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  const getStatusColor = (status?: number): string => {
    if (!status) return '#9E9E9E';
    if (status >= 200 && status < 300) return '#4CAF50';
    if (status >= 300 && status < 400) return '#FF9800';
    if (status >= 400) return '#F44336';
    return '#9E9E9E';
  };

  const formatHeaders = (headers?: NetworkRequestHeaders): string => {
    if (!headers || typeof headers !== 'object') return 'No headers';
    return Object.entries(headers)
      .map(([key, value]: [string, string]) => `${key}: ${value}`)
      .join('\n');
  };

  const formatBody = (body?: string | null): string => {
    if (!body) return 'No body';
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  };

  const generateCurl = (log: NetworkLog): string => {
    let curl: string = `curl -X ${log.method}`;

    if (log.headers && typeof log.headers === 'object') {
      Object.entries(log.headers).forEach(([key, value]: [string, string]) => {
        curl += ` \\\n  -H "${key}: ${value}"`;
      });
    }

    if (log.body) {
      curl += ` \\\n  -d '${log.body}'`;
    }
    curl += ` \\\n  "${log.url}"`;
    return curl;
  };

  const handleHeaderPress = (): void => {
    setExpanded(!expanded);
    generateCurl(log);
  };

  const getStatusText = (): string => {
    if (log.response?.status) {
      return log.response.status.toString();
    }
    if (log.error) {
      return 'ERROR';
    }
    return 'PENDING';
  };

  const getDuration = (): number => {
    return log.response?.duration || log.duration || 0;
  };

  return (
    <View style={styles.logItem}>
      <TouchableOpacity
        style={styles.logHeader}
        onPress={handleHeaderPress}
        activeOpacity={0.7}
      >
        <View style={styles.logSummary}>
          <Text style={styles.method}>{log.method}</Text>
          <Text style={styles.url} numberOfLines={4}>
            {log.url}
          </Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(log.response?.status) },
              ]}
            >
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
            <Text style={styles.duration}>{getDuration()}ms</Text>
          </View>
        </View>
        {expanded ? <Icon type="chevronDown" /> : <Icon type="chevronUp" />}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.logDetails}>
          <ScrollView
            style={styles.detailsScroll}
            nestedScrollEnabled={true} // This is the crucial fix
            showsVerticalScrollIndicator={true}
            bounces={false}
          >
            <View>
              <Text style={styles.codeText}>Copy Curl</Text>
              <CopyItem
                style={styles.copyToClipboard}
                textToCopy={generateCurl(log)}
              />
            </View>
            <View style={styles.clipboardContainer}>
              <Text style={styles.sectionTitle}>Request Headers:</Text>
              {/* <Text style={styles.codeText}>{formatHeaders(log.headers)}</Text> */}
            </View>

            <View style={styles.clipboardContainer}>
              {log.body && (
                <>
                  <Text style={styles.sectionTitle}>Request Body:</Text>
                  <Text style={styles.codeText}>{formatBody(log.body)}</Text>
                </>
              )}
            </View>

            {log.response && (
              <>
                <View style={styles.clipboardContainer}>
                  <Text style={styles.sectionTitle}>Response Headers:</Text>
                  <Text style={styles.codeText}>
                    {formatHeaders(log.response.headers)}
                  </Text>
                </View>

                <View style={styles.clipboardContainer}>
                  <Text style={styles.sectionTitle}>Response Body:</Text>
                  <Text style={styles.codeText}>
                    {formatBody(log.response.body)}
                  </Text>
                  <CopyItem
                    style={[styles.copyToClipboard, { top: '30%' }]}
                    textToCopy={formatBody(log.response.body)}
                  />
                </View>
              </>
            )}

            {log.error && (
              <>
                <Text style={styles.sectionTitle}>Error:</Text>
                <Text style={[styles.codeText, { color: '#F44336' }]}>
                  {log.error}
                </Text>
              </>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  logItem: {
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  clipboardContainer: { position: 'relative' },
  copyToClipboard: {
    position: 'absolute',
    right: '5%',
    top: '15%',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  logSummary: {
    flex: 1,
  },
  method: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  url: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 12,
    color: '#666',
  },
  expandIcon: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontWeight: '600',
  },
  logDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
  },
  detailsScroll: {
    maxHeight: 400,
    padding: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  codeText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    fontWeight: '500',
    lineHeight: 18,
  },
});

export default NetworkLogItem;
export type { NetworkLogItemProps };
