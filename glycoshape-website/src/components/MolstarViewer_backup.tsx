import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Color } from 'molstar/lib/mol-util/color';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import 'molstar/build/viewer/molstar.css';
import './MolstarViewer.css'; // Optional: For custom styling

interface MolstarViewerProps {
    urls: { url: string; format?: 'mmcif' | 'pdb' | 'cif'; isBinary?: boolean; assemblyId?: string }[];
    backgroundColor?: string;
}

const renderReact18 = (component: any, container: Element): any => {
    const htmlContainer = container as HTMLElement;
    const root = ReactDOM.createRoot(htmlContainer);
    root.render(component);
    return root;
};

const MolstarViewer: React.FC<MolstarViewerProps> = ({
    urls,
    backgroundColor = '#FFFFFF',
}) => {
    const viewerRef = useRef<HTMLDivElement | null>(null);
    const pluginRef = useRef<any>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (pluginRef.current) {
            pluginRef.current.layout.update({ isExpanded });
        }
    }, [isExpanded]);

    const hexToNumber = (hex: string): number => {
        const sanitizedHex = hex.replace('#', '');
        return parseInt(sanitizedHex, 16);
    };

    const stylized = async () => {
        if (!pluginRef.current) return;

        pluginRef.current.managers.structure.component.setOptions({
            ...pluginRef.current.managers.structure.component.state.options,
            ignoreLight: true,
        });

        if (pluginRef.current.canvas3d) {
            const pp = pluginRef.current.canvas3d.props.postprocessing;
            pluginRef.current.canvas3d.setProps({
                postprocessing: {
                    outline: {
                        name: 'on',
                        params: pp.outline.name === 'on'
                            ? pp.outline.params
                            : {
                                scale: 0.2,
                                color: Color(0x000000),
                                threshold: 0.33,
                                includeTransparent: true,
                            },
                    },
                    occlusion: {
                        name: 'on',
                        params: pp.occlusion.name === 'on'
                            ? pp.occlusion.params
                            : {
                                multiScale: { name: 'off', params: {} },
                                radius: 5,
                                bias: 0.8,
                                blurKernelSize: 15,
                                samples: 32,
                                resolutionScale: 1,
                                color: Color(0x000000),
                            },
                    },
                    shadow: { name: 'off', params: {} },
                },
            });
        }
    };

    useEffect(() => {
        const initPlugin = async () => {
            if (!viewerRef.current) return;

            try {
                pluginRef.current = await createPluginUI({
                    target: viewerRef.current,
                    render: renderReact18,
                    spec: {
                        ...DefaultPluginUISpec(),
                        layout: {
                            initial: {
                                isExpanded,
                                showControls: false,
                            },
                        },
                        components: {
                            remoteState: 'none',
                        },
                    },
                });

                PluginCommands.Canvas3D.SetSettings(pluginRef.current, {
                    settings: (props: any) => {
                        props.renderer.backgroundColor = Color(hexToNumber(backgroundColor));
                    },
                });

                await loadStructures(urls);

                await stylized();
            } catch (error) {
                console.error('Error initializing Mol* Plugin:', error);
            }
        };

        initPlugin();

        return () => {
            if (pluginRef.current) {
                pluginRef.current.dispose();
                pluginRef.current = null;
            }
        };
    }, [urls, backgroundColor]);

    const loadStructures = async (structures: { url: string; format?: string; isBinary?: boolean; assemblyId?: string }[]) => {
        if (!pluginRef.current) return;

        try {
            for (const { url, format = 'mmcif', isBinary = false, assemblyId } of structures) {
                const data = await pluginRef.current.builders.data.download(
                    { url: Asset.Url(url), isBinary },
                    { state: { isGhost: true } }
                );

                if (!data) {
                    console.warn('No data downloaded for:', url);
                    continue;
                }

                const trajectory = await pluginRef.current.builders.structure.parseTrajectory(data, format);

                await pluginRef.current.builders.structure.hierarchy.applyPreset(
                    trajectory,
                    'default',
                    {
                        structure: assemblyId
                            ? {
                                  name: 'assembly',
                                  params: { id: assemblyId },
                              }
                            : {
                                  name: 'model',
                                  params: {},
                              },
                        showUnitcell: false,
                        representationPreset: 'auto',
                    }
                );

                console.log('Structure loaded successfully for URL:', url);
            }
        } catch (error) {
            console.error('Error loading structures:', error);
        }
    };

    return (
        <div
            className="molstar-container"
            style={{
                zIndex: isExpanded ? 100 : 'auto',
            }}
        >
            <div className="molstar-plugin" ref={viewerRef} />
        </div>
    );
};

export default React.memo(MolstarViewer);
