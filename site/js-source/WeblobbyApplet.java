
/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 *
 * @author cc
 * @license GPL 2
 */

package com.springrts.unitsync;


import com.springrts.unitsync.impl.jna.UnitsyncImpl;
import com.sun.jna.NativeLibrary;
import java.applet.Applet;
import java.io.*;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.channels.Channels;
import java.nio.channels.ReadableByteChannel;
import java.security.AccessController;
import java.security.PrivilegedAction;
import java.util.HashMap;
import java.util.Map;
import java.util.prefs.Preferences;

//import javax.swing.JApplet;

//public class UnitsyncApplet extends JApplet {
public class WeblobbyApplet extends Applet {
    
    private Map<String, Process> processes = new HashMap<String, Process>();
    
    public UnitsyncImpl getUnitsync(final String unitsyncPath) {
        
        UnitsyncImpl unitsync = AccessController.doPrivileged(new PrivilegedAction<UnitsyncImpl>() {
            public UnitsyncImpl run() 
            {
                //Preferences.userRoot().put("unitsync.path", unitsyncPath);
                NativeLibrary.addSearchPath("unitsync", unitsyncPath);
                Preferences.userRoot().put("unitsync.path", "unitsync");
                return new UnitsyncImpl();
            }
        });
        return unitsync;
    }

    
    
    public boolean killCommand( final String cmdName )
    {
        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                echoJs("destroy? " + cmdName);
                echoJs( processes.get(cmdName).toString() );
                
                processes.get(cmdName).destroy();
                
                return null;
            }
        });
        return true;
    }
    
    public void runCommand( final String cmdName, final String cmd )
    {
        new Thread(new Runnable() {
                public void run() {
                    runCommandThread(cmdName, cmd);
                } 
        }).start(); //new Thread(new Runnable() {
    }
    
    private void runCommandThread( final String cmdName, final String cmd )
    //private void runCommandThread( final String cmdName, final String[][] cmds )
    {
        if( !cmd.startsWith( "cmd.exe /c cd \"%USERPROFILE%" ) )
        {
            return;
        }
        
        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                try
                {
                    doJs( "console.log('<Java> " + cmd + " '); ");
                    Runtime runtime = Runtime.getRuntime();
                    Process pr = runtime.exec(cmd);
                    processes.put(cmdName, pr);
                    BufferedReader buf = new BufferedReader(new InputStreamReader(pr.getInputStream()));
                    
                    String line = "";
                    try
                    {
                        while ((line=buf.readLine())!=null) 
                        {
                            line = line.replace("\\", "\\\\");
                            line = line.replace("'", "\\'");
                            doJs("commandStream('"+ cmdName +"', '"+line+"')");
                        }
                    } 
                    catch (IOException e) 
                    {
                        //e.printStackTrace();
                    }
                }
                catch (IOException e) 
                {
                    //e.printStackTrace();
                    for(int i=0; i<e.getStackTrace().length; i++)
                    {
                        echoJs( e.getStackTrace()[i]+"" );
                    }
                }
                
                return null;
            }
        });//AccessController.doPrivileged(new PrivilegedAction() { 
    }
    
    private void echoJs(String out )
    {
        out = out.replace("\\", "\\\\");
        out = out.replace("'", "\\'");
        doJs( "console.log('<Java> " + out + "'); ");
    }
    
    public void doJs2( String script )
    {
       //     JSObject win = JSObject.getWindow(this);
             //win.eval( script );
    }
    
    public void doJs( String jscmd)
    {
        //String jscmd = "window.close()";  /* JavaScript command */
        String jsresult = null;
        boolean success = false;
        try {
        Method getw = null, eval = null;
        Object jswin = null;
        Class c = Class.forName("netscape.javascript.JSObject"); /* does it in IE too */
        Method ms[] = c.getMethods();
        for (int i = 0; i < ms.length; i++) {
            if (ms[i].getName().compareTo("getWindow") == 0)
                getw = ms[i];
            else if (ms[i].getName().compareTo("eval") == 0)
                eval = ms[i];
            
        }
        Object a[] = new Object[1];
        a[0] = this;               /* this is the applet */
        jswin = getw.invoke(c, a); /* this yields the JSObject */
        a[0] = jscmd;
        Object result = eval.invoke(jswin, a);
        if (result instanceof String)
            jsresult = (String) result;
        else
            jsresult = result.toString();
        success = true;
        }

        catch (InvocationTargetException ite) {
        jsresult = "" + ite.getTargetException();
        }
        catch (Exception e) {
        jsresult = "" + e;
        }

        if (success)
            System.out.println("eval succeeded, result is " + jsresult);
        else
            System.out.println("eval failed with error " + jsresult);
    }   
    
    private boolean downloadFile(String source, String target)
    {
        try
        {
            echoJs("Copy file to target: " + target );
            URL dl = new URL( source );
            ReadableByteChannel rbc = Channels.newChannel(dl.openStream());

            FileOutputStream fos = new FileOutputStream( target );
            fos.getChannel().transferFrom(rbc, 0, 1 << 24);
            //System.out.println(fos.getChannel().size());
            fos.close();
            rbc.close();

        }
        catch( MalformedURLException e )
        {
            echoJs("URL error 1 " + e.toString());
            return false;
        }
        catch( IOException e )
        {
            echoJs("URL error 2 " + e.toString());
            for(int i=0; i<e.getStackTrace().length; i++)
            {
                echoJs( e.getStackTrace()[i]+"" );
            }
            return false;
        }
        return true;
    }
    
    public boolean downloadDownloader(final String source, final String os)
    {
         AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                String home = "";
                if( os.equals("Windows") )
                {
                    home = System.getProperty("user.home") + "\\Documents\\My Games\\Spring";
                }
                else
                {
                    return null;
                }
                File f = new File( home );
                f.mkdir();
                f = new File( home + "\\pr-downloader" );
                f.mkdir();

                String sourceFile1 = source + "/pr-downloader.exe";
                String sourceFile2 = source + "/unitsync-ext.dll";
                
                String targetFile1 =  home + "\\pr-downloader\\pr-downloader.exe";
                String targetFile2 =  home + "\\pr-downloader\\unitsync-ext.dll";

                if( !downloadFile( sourceFile1, targetFile1) )
                {
                    //return false
                }
                downloadFile( sourceFile2, targetFile2);
                
                return null;
            }
         });
         
         return true;
                 
    }
    
}
