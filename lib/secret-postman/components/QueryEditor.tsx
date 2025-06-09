'use client';

import { showToastOnce } from '@/utils/toast/toastManager';
import * as Tabs from '@radix-ui/react-tabs';
import { Code, Copy, Eye, EyeOff, Layers, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSecretPostmanStore } from '../store/secretPostmanStore';
import { TemplateContext } from '../types';
import {
  extractTemplateVariables,
  formatJson,
  processTemplateVariables,
  validateJsonQuery,
} from '../utils';

interface QueryEditorProps {
  className?: string;
}

interface JsonProperty {
  id: string;
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  level: number;
  isExpanded?: boolean;
  parentKey?: string;
}

interface RenderPropertyComponentArg {
  handlePropertyChange: (
    itemId: string,
    field: 'key' | 'value' | 'type',
    newValue: unknown
  ) => void;
  addProperty: (parentId?: string, parentLevel?: number) => void;
  addNestedObject: (parentId?: string, parentLevel?: number) => void;
  removeProperty: (itemIdToRemove: string) => void;
  structuredData: JsonProperty[];
  renderPropertyFn: (item: JsonProperty, componentArg: RenderPropertyComponentArg) => JSX.Element;
}

export default function QueryEditor({ className }: QueryEditorProps) {
  const { currentQuery, setQuery, setRawQuery, setQueryMode, clearPendingStructuredInput } =
    useSecretPostmanStore();

  const [structuredData, setStructuredData] = useState<JsonProperty[]>([]);
  const [isValidJson, setIsValidJson] = useState(true);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const valueInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(
    null
  );

  const coerceValueToType = (currentValue: unknown, newType: JsonProperty['type']): unknown => {
    if (newType === 'string') {
      return typeof currentValue === 'string' ||
        typeof currentValue === 'number' ||
        typeof currentValue === 'boolean'
        ? String(currentValue)
        : '';
    }
    if (newType === 'number') {
      const num = parseFloat(String(currentValue));
      return isNaN(num) ? 0 : num;
    }
    if (newType === 'boolean') {
      if (typeof currentValue === 'boolean') return currentValue;
      const valStr = String(currentValue).toLowerCase();
      return valStr === 'true' || valStr === '1';
    }
    if (newType === 'array') {
      if (typeof currentValue === 'string') {
        try {
          const parsed: unknown = JSON.parse(currentValue);
          return Array.isArray(parsed) ? currentValue : '[]';
        } catch {
          return '[]';
        }
      }
      return '[]';
    }
    if (newType === 'object') {
      return '';
    }
    return currentValue;
  };

  const generateUniqueId = () =>
    `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

  const jsonToStructuredData = useCallback(
    (
      obj: Record<string, unknown>,
      prefix = '',
      level = 0,
      parentKeyProp?: string
    ): JsonProperty[] => {
      const properties: JsonProperty[] = [];
      Object.entries(obj).forEach(([keySegment, value]) => {
        const sanitizedKeySegment = keySegment.replace(/\./g, '_');
        const fullKey = prefix ? `${prefix}.${sanitizedKeySegment}` : sanitizedKeySegment;
        const id = generateUniqueId();

        const commonProps = {
          id,
          key: fullKey,
          level,
          ...(parentKeyProp !== undefined ? { parentKey: parentKeyProp } : {}),
        };

        if (value === null || value === undefined) {
          properties.push({ ...commonProps, value: '', type: 'string' });
        } else if (typeof value === 'string') {
          properties.push({ ...commonProps, value, type: 'string' });
        } else if (typeof value === 'number') {
          properties.push({ ...commonProps, value, type: 'number' });
        } else if (typeof value === 'boolean') {
          properties.push({ ...commonProps, value, type: 'boolean' });
        } else if (Array.isArray(value)) {
          properties.push({
            ...commonProps,
            value: JSON.stringify(value, null, 2),
            type: 'array',
            isExpanded: true,
          });
        } else if (typeof value === 'object') {
          properties.push({
            ...commonProps,
            value: '',
            type: 'object',
            isExpanded: true,
          });
          properties.push(
            ...jsonToStructuredData(value as Record<string, unknown>, fullKey, level + 1, fullKey)
          );
        }
      });
      return properties;
    },
    []
  );

  const structuredDataToJson = useCallback(
    (properties: JsonProperty[]): Record<string, unknown> => {
      const result: Record<string, unknown> = {};
      const childrenMap: Record<string, JsonProperty[]> = {};

      properties.forEach((p) => {
        const parentK = p.parentKey || '__ROOT__';
        if (!childrenMap[parentK]) {
          childrenMap[parentK] = [];
        }
        childrenMap[parentK].push(p);
      });

      const buildObject = (
        currentObject: Record<string, unknown>,
        parentKeyForChildren: string
      ) => {
        const children = childrenMap[parentKeyForChildren] || [];
        children.sort((a, b) => a.key.localeCompare(b.key));

        children.forEach((prop) => {
          const keySegments = prop.key.split('.');
          const leafName = keySegments[keySegments.length - 1] ?? prop.id;

          if (prop.type === 'object') {
            currentObject[leafName] = {};
            buildObject(currentObject[leafName] as Record<string, unknown>, prop.key);
          } else {
            try {
              if (prop.type === 'array') {
                const arrayValue: unknown = JSON.parse(String(prop.value));
                currentObject[leafName] = arrayValue;
              } else if (prop.type === 'number') {
                const numVal = parseFloat(String(prop.value));
                currentObject[leafName] = isNaN(numVal) ? String(prop.value) : numVal;
              } else if (prop.type === 'boolean') {
                const valStr = String(prop.value).toLowerCase();
                currentObject[leafName] = !(valStr === 'false' || valStr === '0' || valStr === '');
              } else {
                currentObject[leafName] = String(prop.value);
              }
            } catch (e) {
              console.warn(`Failed to parse value for key ${prop.key} (id: ${prop.id}):`, e);
              currentObject[leafName] = prop.value;
            }
          }
        });
      };

      buildObject(result, '__ROOT__');
      return result;
    },
    []
  );

  useEffect(() => {
    if (currentQuery.mode === 'structured') {
      let jsonFromCurrentStructure = '{}';
      try {
        if (
          structuredData.length > 0 ||
          (currentQuery.rawQuery !== '{}' && currentQuery.rawQuery.trim() !== '')
        ) {
          jsonFromCurrentStructure = formatJson(structuredDataToJson(structuredData));
        }
      } catch (e) {
        console.error('Error generating JSON from current structured data for comparison:', e);
        jsonFromCurrentStructure = `__error_generating_json_${Date.now()}__`;
      }

      if (currentQuery.rawQuery !== jsonFromCurrentStructure) {
        try {
          if (currentQuery.rawQuery.trim() === '{}' || currentQuery.rawQuery.trim() === '') {
            if (structuredData.length > 0) {
              setStructuredData([]);
              setIsValidJson(true);
              setJsonError(null);
            }
          } else {
            const parsed: unknown = JSON.parse(currentQuery.rawQuery);
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
              setStructuredData(jsonToStructuredData(parsed as Record<string, unknown>));
              setIsValidJson(true);
              setJsonError(null);
            } else {
              setIsValidJson(false);
              setJsonError('Structured query must be a JSON object.');
            }
          }
        } catch (_error) {
          setIsValidJson(false);
          setJsonError(_error instanceof Error ? _error.message : 'Invalid JSON syntax');
        }
      }
    }
  }, [currentQuery.rawQuery, currentQuery.mode, jsonToStructuredData, structuredDataToJson]);

  useEffect(() => {
    const variables = extractTemplateVariables(currentQuery.rawQuery);
    setTemplateVariables(variables);
  }, [currentQuery.rawQuery]);

  const handleRawQueryChange = (value: string) => {
    setRawQuery(value);
    const validation = validateJsonQuery(value);
    setIsValidJson(validation.valid);
    setJsonError(validation.error || null);
    if (validation.valid && validation.parsed) {
      setQuery(validation.parsed);
    } else if (!validation.valid && (value.trim() === '' || value.trim() === '{}')) {
      setQuery({});
    }
  };

  const updateStoreFromStructured = useCallback(
    (updatedStructuredData: JsonProperty[]) => {
      try {
        const newQueryObject = structuredDataToJson(updatedStructuredData);
        const newRawQuery = formatJson(newQueryObject);
        setQuery(newQueryObject);
        setRawQuery(newRawQuery);
      } catch (error) {
        console.error('Error updating store from structured data:', error);
      }
    },
    [setQuery, setRawQuery, structuredDataToJson]
  );

  // Handle pendingStructuredInput for inserting template variables into structured editor fields
  useEffect(() => {
    if (currentQuery.pendingStructuredInput) {
      const { itemId, textToInsert } = currentQuery.pendingStructuredInput;

      // Find the item and update its value
      const updatedStructuredData = structuredData.map((item) => {
        if (item.id === itemId) {
          const currentValue = (() => {
            if (typeof item.value === 'string') return item.value;
            if (typeof item.value === 'number' || typeof item.value === 'boolean')
              return String(item.value);
            return '';
          })();
          const newValue = currentValue + textToInsert;
          return { ...item, value: newValue };
        }
        return item;
      });

      if (updatedStructuredData.some((item, index) => item !== structuredData[index])) {
        setStructuredData(updatedStructuredData);
        updateStoreFromStructured(updatedStructuredData);
      }

      clearPendingStructuredInput();
    }
  }, [
    currentQuery.pendingStructuredInput,
    structuredData,
    updateStoreFromStructured,
    clearPendingStructuredInput,
  ]);

  const handlePropertyChange = useCallback(
    (itemId: string, field: 'key' | 'value' | 'type', newValue: unknown) => {
      const newStructuredData = structuredData.map((p) => {
        if (p.id === itemId) {
          if (field === 'key') {
            // For key changes, we need to update the full key path
            const keySegments = p.key.split('.');
            const newLeafName = String(newValue);
            keySegments[keySegments.length - 1] = newLeafName;
            const newFullKey = keySegments.join('.');
            return { ...p, key: newFullKey };
          }
          if (field === 'value') {
            return { ...p, value: newValue };
          }
          if (field === 'type') {
            const newTypeAsserted = newValue as JsonProperty['type'];
            const coercedValue: unknown = coerceValueToType(p.value, newTypeAsserted);
            return { ...p, type: newTypeAsserted, value: coercedValue };
          }
        }
        return p;
      });

      setStructuredData(newStructuredData);
      updateStoreFromStructured(newStructuredData);
    },
    [structuredData, updateStoreFromStructured]
  );

  const addProperty = useCallback(
    (parentId?: string, parentLevel?: number) => {
      const newId = generateUniqueId();
      const level = parentId !== undefined && parentLevel !== undefined ? parentLevel + 1 : 0;
      const parentProperty = parentId ? structuredData.find((p) => p.id === parentId) : null;
      const parentKeyPrefix = parentProperty ? parentProperty.key : '';
      let newLeafName = 'newProperty';
      let counter = 0;
      const siblings = structuredData.filter(
        (p) => p.parentKey === (parentProperty ? parentProperty.key : undefined)
      );
      while (
        siblings.some(
          (p) => p.key === (parentKeyPrefix ? `${parentKeyPrefix}.${newLeafName}` : newLeafName)
        )
      ) {
        counter++;
        newLeafName = `newProperty${counter}`;
      }
      const newFullKey = parentKeyPrefix ? `${parentKeyPrefix}.${newLeafName}` : newLeafName;
      const newProperty: JsonProperty = {
        id: newId,
        key: newFullKey,
        value: '',
        type: 'string',
        level,
        ...(parentProperty ? { parentKey: parentProperty.key } : {}),
      };
      const updatedData = [...structuredData, newProperty];
      setStructuredData(updatedData);
      updateStoreFromStructured(updatedData);
    },
    [structuredData, updateStoreFromStructured, generateUniqueId]
  );

  const addNestedObject = useCallback(
    (parentId?: string, parentLevel?: number) => {
      const newId = generateUniqueId();
      const level = parentId !== undefined && parentLevel !== undefined ? parentLevel + 1 : 0;
      const parentProperty = parentId ? structuredData.find((p) => p.id === parentId) : null;
      const parentKeyPrefix = parentProperty ? parentProperty.key : '';
      let newLeafName = 'newObject';
      let counter = 0;
      const siblings = structuredData.filter(
        (p) => p.parentKey === (parentProperty ? parentProperty.key : undefined)
      );
      while (
        siblings.some(
          (p) => p.key === (parentKeyPrefix ? `${parentKeyPrefix}.${newLeafName}` : newLeafName)
        )
      ) {
        counter++;
        newLeafName = `newObject${counter}`;
      }
      const newFullKey = parentKeyPrefix ? `${parentKeyPrefix}.${newLeafName}` : newLeafName;
      const newObjectProp: JsonProperty = {
        id: newId,
        key: newFullKey,
        value: '',
        type: 'object',
        level,
        isExpanded: true,
        ...(parentProperty ? { parentKey: parentProperty.key } : {}),
      };
      const updatedData = [...structuredData, newObjectProp];
      setStructuredData(updatedData);
      updateStoreFromStructured(updatedData);
    },
    [structuredData, updateStoreFromStructured, generateUniqueId]
  );

  const removeProperty = useCallback(
    (itemIdToRemove: string) => {
      const itemToRemove = structuredData.find((p) => p.id === itemIdToRemove);
      if (!itemToRemove) return;
      const itemsToRemoveIds = new Set<string>([itemIdToRemove]);
      if (itemToRemove.type === 'object') {
        const queue: string[] = [itemToRemove.key]; // Use item key as identifier for hierarchy
        while (queue.length > 0) {
          const currentParentKey = queue.shift()!;
          structuredData.forEach((prop) => {
            if (prop.parentKey === currentParentKey) {
              itemsToRemoveIds.add(prop.id);
              if (prop.type === 'object') {
                queue.push(prop.key);
              }
            }
          });
        }
      }
      const updatedData = structuredData.filter((prop) => !itemsToRemoveIds.has(prop.id));
      setStructuredData(updatedData);
      updateStoreFromStructured(updatedData);
    },
    [structuredData, updateStoreFromStructured]
  );

  const getPropertyDisplayName = (property: JsonProperty) => property.key.split('.').pop() || '';

  const getChildProperties = (targetParentFullKey: string, currentStructuredData: JsonProperty[]) =>
    currentStructuredData
      .filter((prop) => prop.parentKey === targetParentFullKey)
      .sort((a, b) => a.key.localeCompare(b.key));

  const getPreviewJson = () => {
    if (templateVariables.length === 0) return currentQuery.rawQuery;
    const mockContext: TemplateContext = {};
    templateVariables.forEach((variable) => {
      mockContext[variable] = `[${variable}]`;
    });
    return processTemplateVariables(currentQuery.rawQuery, mockContext);
  };

  const renderProperty = (
    item: JsonProperty,
    componentArg: RenderPropertyComponentArg
  ): JSX.Element => {
    const isObject = item.type === 'object';
    const children = isObject ? getChildProperties(item.key, componentArg.structuredData) : [];

    return (
      <div
        key={item.id}
        className={`ml-${item.level * 4} mb-2 relative group`}
        style={{ paddingLeft: `${item.level * 1.5}rem` }}
      >
        {item.level > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-adamant-box-border"
            style={{
              left: `${(item.level - 1) * 1.5 + 0.75}rem`,
              top: '-0.5rem',
              height: 'calc(100% + 0.5rem)',
            }}
          ></div>
        )}
        {item.level > 0 && (
          <div
            className="absolute left-0 top-1/2 w-2 h-px bg-adamant-box-border"
            style={{ left: `${(item.level - 1) * 1.5 + 0.75}rem`, transform: 'translateY(-50%)' }}
          ></div>
        )}

        {isObject ? (
          <div className="bg-adamant-box-dark/30 rounded-md p-3 border border-adamant-box-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-grow">
                <Layers size={16} className="text-adamant-accentText opacity-80" />
                <input
                  type="text"
                  value={getPropertyDisplayName(item)}
                  onChange={(e) =>
                    componentArg.handlePropertyChange(item.id, 'key', e.target.value)
                  }
                  className="flex-grow font-semibold bg-transparent outline-none text-adamant-text-box-main placeholder:text-adamant-text-disabled"
                  placeholder="object_name"
                />
              </div>
              <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => componentArg.addProperty(item.id, item.level)}
                  title="Add Property to this object"
                  className="p-1 hover:bg-adamant-box-light rounded"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => componentArg.addNestedObject(item.id, item.level)}
                  title="Add Nested Object"
                  className="p-1 hover:bg-adamant-box-light rounded"
                >
                  <Layers size={14} />
                </button>
                <button
                  onClick={() => componentArg.removeProperty(item.id)}
                  title="Delete Object"
                  className="p-1 hover:text-red-500 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {children.length > 0 ? (
              children.map((child) => componentArg.renderPropertyFn(child, componentArg))
            ) : (
              <div className="pl-4 text-xs text-adamant-text-secondary italic">
                This object is empty. Add properties or nested objects.
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <input
              type="text"
              value={getPropertyDisplayName(item)}
              onChange={(e) => componentArg.handlePropertyChange(item.id, 'key', e.target.value)}
              placeholder="property_name"
              className="w-1/3 bg-adamant-app-input border border-adamant-box-border/60 text-sm rounded-md px-2 py-1 outline-none focus:border-adamant-accentText/70 transition-colors placeholder:text-adamant-text-disabled"
            />
            <select
              value={item.type}
              onChange={(e) =>
                componentArg.handlePropertyChange(
                  item.id,
                  'type',
                  e.target.value as JsonProperty['type']
                )
              }
              className="bg-adamant-app-input border border-adamant-box-border/60 text-sm rounded-md px-2 py-1 h-[26px] outline-none focus:border-adamant-accentText/70 transition-colors"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="array">Array</option>
            </select>

            {item.type === 'string' || item.type === 'number' ? (
              <input
                type={item.type === 'number' ? 'number' : 'text'}
                value={item.value as string}
                onChange={(e) =>
                  componentArg.handlePropertyChange(item.id, 'value', e.target.value)
                }
                onFocus={(e) => (valueInputRef.current = e.target as HTMLInputElement)}
                data-structured-editor-input="true"
                data-item-id={item.id}
                data-field-type="value"
                placeholder={item.type === 'string' ? 'value or {{TEMPLATE}}' : 'number'}
                className="flex-grow bg-adamant-app-input border border-adamant-box-border/60 text-sm rounded-md px-2 py-1 outline-none focus:border-adamant-accentText/70 transition-colors placeholder:text-adamant-text-disabled"
              />
            ) : item.type === 'boolean' ? (
              <select
                value={String(item.value)}
                onChange={(e) =>
                  componentArg.handlePropertyChange(item.id, 'value', e.target.value === 'true')
                }
                data-structured-editor-input="true"
                data-item-id={item.id}
                data-field-type="value"
                onFocus={(e) => (valueInputRef.current = e.target as HTMLSelectElement)}
                className="flex-grow bg-adamant-app-input border border-adamant-box-border/60 text-sm rounded-md px-2 py-1 h-[26px] outline-none focus:border-adamant-accentText/70 transition-colors"
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : item.type === 'array' ? (
              <textarea
                value={item.value as string}
                onChange={(e) =>
                  componentArg.handlePropertyChange(item.id, 'value', e.target.value)
                }
                onFocus={(e) => (valueInputRef.current = e.target as HTMLTextAreaElement)}
                data-structured-editor-input="true"
                data-item-id={item.id}
                data-field-type="value"
                placeholder='[\n  "value1",\n  123,\n  true\n]'
                className="flex-grow bg-adamant-app-input border border-adamant-box-border/60 text-sm rounded-md px-2 py-1 outline-none focus:border-adamant-accentText/70 transition-colors placeholder:text-adamant-text-disabled min-h-[60px] resize-y font-mono"
                rows={3}
              />
            ) : null}
            <button
              onClick={() => componentArg.removeProperty(item.id)}
              title="Delete Property"
              className="p-1 opacity-50 group-hover:opacity-100 hover:text-red-500 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };

  const componentArg: RenderPropertyComponentArg = {
    handlePropertyChange,
    addProperty,
    addNestedObject,
    removeProperty,
    structuredData,
    renderPropertyFn: renderProperty,
  };

  if (currentQuery.mode === 'structured' && (!structuredData || structuredData.length === 0)) {
    return (
      <div className="p-4 text-center text-sm text-adamant-text-secondary border border-dashed border-adamant-box-border rounded-lg">
        <Layers className="mx-auto mb-2 h-8 w-8 opacity-50" />
        No properties defined for this query.
        <div className="mt-3 flex justify-center gap-2">
          <button
            onClick={() => addProperty()}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-adamant-box-dark hover:bg-adamant-box-light text-adamant-text-box-main rounded-md transition-colors border border-adamant-box-border"
          >
            <Plus size={14} /> Add Property
          </button>
          <button
            onClick={() => addNestedObject()}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-adamant-box-dark hover:bg-adamant-box-light text-adamant-text-box-main rounded-md transition-colors border border-adamant-box-border"
          >
            <Plus size={14} /> Add Object
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-adamant-box-regular rounded-xl border border-adamant-box-border ${className}`}
    >
      <div className="p-4 border-b border-adamant-box-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-adamant-text-box-main">Query Editor</h3>
          <div className="flex items-center gap-2">
            {templateVariables.length > 0 && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="p-1.5 text-adamant-text-box-secondary hover:text-adamant-accentText transition-colors"
                title={showPreview ? 'Hide preview' : 'Show template preview'}
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={() => {
                void navigator.clipboard.writeText(currentQuery.rawQuery);
                showToastOnce('query-copied', 'Query copied to clipboard', 'success');
              }}
              className="p-1.5 text-adamant-text-box-secondary hover:text-adamant-accentText transition-colors"
              title="Copy query"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Tabs.Root
          value={currentQuery.mode}
          onValueChange={(value) => setQueryMode(value as 'structured' | 'raw')}
        >
          <Tabs.List className="flex bg-adamant-box-dark rounded-lg p-1">
            <Tabs.Trigger
              value="structured"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-adamant-box-regular data-[state=active]:text-adamant-text-box-main text-adamant-text-box-secondary hover:text-adamant-text-box-main"
            >
              <Layers className="h-4 w-4" />
              Structured
            </Tabs.Trigger>
            <Tabs.Trigger
              value="raw"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-adamant-box-regular data-[state=active]:text-adamant-text-box-main text-adamant-text-box-secondary hover:text-adamant-text-box-main"
            >
              <Code className="h-4 w-4" />
              Raw JSON
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="structured" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-adamant-text-box-secondary">
                  Query Structure
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => addProperty()}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-adamant-box-dark hover:bg-adamant-box-light text-adamant-text-box-main rounded-md transition-colors border border-adamant-box-border"
                  >
                    <Plus className="h-3 w-3" />
                    Add Property
                  </button>
                  <button
                    onClick={() => addNestedObject()}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-adamant-box-dark hover:bg-adamant-box-light text-adamant-text-box-main rounded-md transition-colors border border-adamant-box-border"
                  >
                    <Layers className="h-3 w-3" />
                    Add Object
                  </button>
                </div>
              </div>

              <div className="max-h-[30rem] overflow-y-auto space-y-1 pr-1 pb-1">
                {structuredData
                  .filter((p) => !p.parentKey)
                  .sort((a, b) => a.key.localeCompare(b.key))
                  .map((item) => renderProperty(item, componentArg))}
                {structuredData.filter((p) => !p.parentKey).length === 0 && (
                  <div className="text-center py-12 text-adamant-text-box-secondary bg-adamant-box-dark/20 rounded-lg border border-adamant-box-border border-dashed">
                    <Layers className="h-8 w-8 mx-auto mb-3 text-adamant-text-box-secondary/50" />
                    <div className="text-sm font-medium mb-1">No query structure defined</div>
                    <div className="text-xs">Start by adding a property or object.</div>
                  </div>
                )}
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="raw" className="mt-4">
            <div className="space-y-2">
              <textarea
                data-query-editor="raw"
                value={currentQuery.rawQuery}
                onChange={(e) => handleRawQueryChange(e.target.value)}
                placeholder="Enter your JSON query here..."
                className="w-full h-64 bg-adamant-app-input rounded-lg p-3 text-sm font-mono text-adamant-text-form-main border border-white/5 focus:border-adamant-accentText/30 outline-none resize-none"
              />
              {!isValidJson && jsonError && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <strong>JSON Error:</strong> {jsonError}
                </div>
              )}
              {templateVariables.length > 0 && (
                <div className="text-sm text-adamant-text-box-secondary bg-adamant-box-dark rounded-lg p-3">
                  <strong>Template Variables:</strong>{' '}
                  {templateVariables.map((v) => `{{${v}}}`).join(', ')}
                  {(templateVariables.includes('HEIGHT') ||
                    templateVariables.includes('BLOCK_HEIGHT')) && (
                    <div className="mt-2 text-xs text-adamant-accentText">
                      💡 Tip: Enable "Auto-fetch latest height" in Contract Information to
                      automatically populate height variables.
                    </div>
                  )}
                  {templateVariables.includes('ADDRESS') && (
                    <div className="mt-2 text-xs text-adamant-accentText">
                      💡 Tip: {`{{ADDRESS}}`} will be replaced with your connected Keplr wallet
                      address.
                    </div>
                  )}
                  {templateVariables.includes('VIEWING_KEY') && (
                    <div className="mt-2 text-xs text-adamant-accentText">
                      💡 Tip: {`{{VIEWING_KEY}}`} will be replaced with the viewing key for the
                      contract address from Keplr.
                    </div>
                  )}
                </div>
              )}
              {showPreview && templateVariables.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-adamant-text-box-secondary">
                    Template Preview:
                  </div>
                  <pre className="text-xs bg-adamant-box-dark rounded-lg p-3 text-adamant-text-box-secondary overflow-x-auto">
                    {getPreviewJson()}
                  </pre>
                </div>
              )}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
